// components/schedule/schedule-board.tsx
"use client";

import * as React from "react";
import {
  format,
  isSameDay,
  isWithinInterval,
  setHours,
  setMinutes,
} from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LessonForm } from "./lesson-form";

type Group = { id: number; name: string };

type Lesson = {
  id: number;
  date: string | Date;
  startAt: string | Date;
  endAt: string | Date;
  groupId: number;
  room?: { name: string } | null;
  subject?: { name: string } | null;
  teacher?: { person?: { lastName?: string | null } | null } | null;
};

type Props = {
  weekDays: Date[]; // 7 дней, начиная с понедельника
  groups: Group[]; // выбранные группы
  lessons: Lesson[]; // уроки (уже приведены с startAt/endAt)
  isDraft?: boolean; // режим черновика — разрешаем создание по клику
  draftBatchId?: number | null; // нужен для создания уроков
  onRequestRefresh?: () => void; // опционально: родитель перезагружает данные после создания
};

export function ScheduleBoard({
  weekDays,
  groups,
  lessons,
  isDraft = false,
  draftBatchId = null,
  onRequestRefresh,
}: Props) {
  const hours = Array.from({ length: 11 }, (_, i) => 8 + i); // 8..18

  // Локальное состояние дроуера создания
  const [formOpen, setFormOpen] = React.useState(false);
  const [formDate, setFormDate] = React.useState<Date | null>(null);
  const [formGroupId, setFormGroupId] = React.useState<number | null>(null);

  // Открыть форму по клику на ячейку (только в черновике и если есть batchId)
  const handleCellClick = (day: Date, groupId: number) => {
    if (!isDraft || !draftBatchId) return;
    setFormDate(day);
    setFormGroupId(groupId);
    setFormOpen(true);
  };

  // После создания: закрываем форму и даём родителю сигнал обновить данные
  const handleCreated = () => {
    setFormOpen(false);
    if (onRequestRefresh) onRequestRefresh();
  };

  return (
    <div className="overflow-auto rounded-xl border">
      <div className="min-w-[1000px]">
        {/* Шапка с днями недели */}
        <div className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr]">
          <div />
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${groups.length * 7}, minmax(180px, 1fr))`,
            }}
          >
            {weekDays.map((d) => (
              <div
                key={d.toISOString()}
                className={cn(
                  "col-span-[var(--col-span,1)] border-l p-2 text-center font-medium sticky top-0 bg-background z-10",
                )}
                style={{ ["--col-span" as any]: groups.length }}
              >
                {format(d, "EEE d MMM", { locale: ru })}
              </div>
            ))}
          </div>
        </div>

        {/* Сетка слотов */}
        {hours.map((h) => (
          <div
            key={h}
            className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] border-t"
          >
            <div className="p-2 text-sm text-muted-foreground">{h}:00</div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${groups.length * 7}, minmax(180px, 1fr))`,
              }}
            >
              {weekDays.flatMap((d) =>
                groups.map((g) => {
                  const cellKey = `${d.toISOString()}-${g.id}-${h}`;
                  const slotStart = setMinutes(setHours(d, h), 0);

                  const cellLessons = lessons.filter(
                    (l) =>
                      l.groupId === g.id &&
                      isSameDay(new Date(l.startAt), d) &&
                      isWithinInterval(slotStart, {
                        start: new Date(l.startAt),
                        end: new Date(l.endAt),
                      }),
                  );

                  return (
                    <div
                      key={cellKey}
                      className={cn(
                        "relative h-24 border-l",
                        isDraft && draftBatchId
                          ? "cursor-pointer hover:bg-muted/40"
                          : "cursor-default",
                      )}
                      onClick={() => handleCellClick(d, g.id)}
                    >
                      {cellLessons.map((l) => (
                        <div
                          key={l.id}
                          className={cn(
                            "absolute inset-1 flex flex-col gap-1 overflow-hidden rounded-md border p-2 shadow-sm bg-background",
                          )}
                        >
                          <div className="text-xs opacity-70">
                            {format(new Date(l.startAt), "HH:mm")}–
                            {format(new Date(l.endAt), "HH:mm")}
                          </div>
                          <div className="truncate text-sm font-medium">
                            {l.subject?.name ?? "Без предмета"}
                          </div>
                          <div className="truncate text-xs">
                            {l.teacher?.person?.lastName ?? ""}
                          </div>
                          <div className="truncate text-xs opacity-70">
                            {l.room?.name ?? ""}
                          </div>
                          {isDraft && (
                            <div className="mt-auto text-[10px] uppercase tracking-wide text-amber-700">
                              черновик
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Дроуер создания урока */}
      {isDraft &&
        draftBatchId &&
        formOpen &&
        formDate &&
        formGroupId !== null && (
          <LessonForm
            open={formOpen}
            onOpenChange={setFormOpen}
            batchId={draftBatchId}
            date={formDate}
            groupId={formGroupId}
            onCreated={handleCreated}
          />
        )}
    </div>
  );
}
