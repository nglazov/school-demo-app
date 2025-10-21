// components/schedule/schedule-board.tsx
"use client";

import * as React from "react";
import { format, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LessonForm } from "./lesson-form";

type Group = { id: number; name: string };

type Lesson = {
  id: number;
  date: string | Date;
  startAt: string | Date; // Date
  endAt: string | Date; // Date
  groupId: number;
  room?: { name: string } | null;
  subject?: { name: string } | null;
  teacher?: { person?: { lastName?: string | null } | null } | null;
};

type Props = {
  weekDays: Date[]; // 7 дней
  groups: Group[]; // выбранные группы
  lessons: Lesson[]; // уроки (со startAt/endAt)
  isDraft?: boolean;
  draftBatchId?: number | null;
  onRequestRefresh?: () => void;
};

/** Настройки шкалы времени */
const START_MIN = 8 * 60; // 08:00
const END_MIN = 18 * 60; // 18:00
const TOTAL_MIN = END_MIN - START_MIN;
const PX_PER_MIN = 1; // 1px = 1 минута → общая высота 600px
const TRACK_HEIGHT = TOTAL_MIN * PX_PER_MIN; // 600px

function minutesSinceMidnight(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

export function ScheduleBoard({
  weekDays,
  groups,
  lessons,
  isDraft = false,
  draftBatchId = null,
  onRequestRefresh,
}: Props) {
  // форма создания
  const [formOpen, setFormOpen] = React.useState(false);
  const [formDate, setFormDate] = React.useState<Date | null>(null);
  const [formGroupId, setFormGroupId] = React.useState<number | null>(null);

  const openForm = (day: Date, groupId: number) => {
    if (!isDraft || !draftBatchId) return;
    setFormDate(day);
    setFormGroupId(groupId);
    setFormOpen(true);
  };

  const handleCreated = () => {
    setFormOpen(false);
    onRequestRefresh?.();
  };

  // Левый бордер с часами и линиями
  const HourScale = () => {
    const hours = Array.from(
      { length: (END_MIN - START_MIN) / 60 + 1 },
      (_, i) => 8 + i,
    ); // 8..18
    return (
      <div className="relative" style={{ height: TRACK_HEIGHT }}>
        {hours.map((h) => {
          const top = (h * 60 - START_MIN) * PX_PER_MIN;
          return (
            <div key={h} className="absolute left-0 right-0">
              <div
                className="absolute left-0 top-0 h-px w-full bg-border"
                style={{ transform: `translateY(${top}px)` }}
              />
              <div
                className="absolute -translate-y-1/2 px-2 text-xs text-muted-foreground"
                style={{ top }}
              >
                {h}:00
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Колонка (день × группа) — единый трек высотой 600px с абсолютным позиционированием карточек
  const DayGroupColumn = ({ day, group }: { day: Date; group: Group }) => {
    // фильтруем уроки этого дня и группы
    const items = lessons
      .filter(
        (l) => l.groupId === group.id && isSameDay(new Date(l.startAt), day),
      )
      .map((l) => {
        const s = new Date(l.startAt);
        const e = new Date(l.endAt);
        const startMin = minutesSinceMidnight(s);
        const endMin = Math.max(startMin + 5, minutesSinceMidnight(e)); // защита: хотя бы 5 мин
        // координаты в пределах [START_MIN, END_MIN]
        const clampedStart = Math.max(START_MIN, Math.min(endMin, startMin));
        const clampedEnd = Math.min(END_MIN, Math.max(START_MIN, endMin));
        const top = (clampedStart - START_MIN) * PX_PER_MIN;
        const height = Math.max(18, (clampedEnd - clampedStart) * PX_PER_MIN); // min 18px, чтобы влез текст
        return { ...l, top, height };
      })
      .sort((a, b) => a.top - b.top);

    // Клик по пустому месту для создания
    const onTrackClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
      if (!isDraft || !draftBatchId) return;
      // можем позже прокинуть дефолтные время начала/окончания в форму
      openForm(day, group.id);
    };

    return (
      <div
        className={cn(
          "relative border-l bg-background",
          isDraft && draftBatchId
            ? "cursor-pointer hover:bg-muted/30"
            : "cursor-default",
        )}
        style={{ height: TRACK_HEIGHT }}
        onClick={onTrackClick}
      >
        {/* Подложка с тонкими почасовыми линиями */}
        {Array.from({ length: (END_MIN - START_MIN) / 60 }, (_, i) => i).map(
          (i) => (
            <div
              key={i}
              className="pointer-events-none absolute left-0 right-0 h-px bg-border"
              style={{ top: i * 60 * PX_PER_MIN }}
            />
          ),
        )}

        {/* Карточки уроков (не дублируются) */}
        {items.map((l) => (
          <div
            key={l.id}
            className={cn(
              "absolute inset-x-1 overflow-hidden rounded-md border bg-card p-2 shadow-sm",
              isDraft ? "border-amber-400" : "border-muted",
            )}
            style={{ top: l.top + 2, height: l.height - 4 }} // небольшие отступы
            onClick={(e) => {
              e.stopPropagation();
              // здесь позже подключим «редактирование» карточки (Sheet/Dialog)
            }}
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
              <div className="pointer-events-none absolute bottom-1 right-2 text-[10px] uppercase tracking-wide text-amber-700">
                черновик
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="overflow-auto rounded-xl border">
      <div className="min-w-[1000px]">
        {/* Заголовок: дни (каждый занимает groups.length колонок) */}
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
                className="col-span-[var(--col-span,1)] border-l p-2 text-center font-medium sticky top-0 z-10 bg-background"
                style={{ ["--col-span" as any]: groups.length }}
              >
                {format(d, "EEE d MMM", { locale: ru })}
              </div>
            ))}
          </div>
        </div>

        {/* Тело: слева шкала часов, справа — грид (7 дней × N групп), у каждой — единый вертикальный трек */}
        <div className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] border-t">
          <div className="border-r">
            <HourScale />
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${groups.length * 7}, minmax(180px, 1fr))`,
            }}
          >
            {weekDays.flatMap((d) =>
              groups.map((g) => (
                <DayGroupColumn
                  key={`${d.toISOString()}-${g.id}`}
                  day={d}
                  group={g}
                />
              )),
            )}
          </div>
        </div>
      </div>

      {/* Дроуер создания */}
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
