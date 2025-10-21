"use client";

import * as React from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDraftLesson } from "@/app/(admin)/schedule/lesson-actions";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // минимальный набор данных для создания урока
  batchId: number; // текущий DRAFT-батч
  date: Date; // день (из слота/ячейки)
  groupId: number; // колонка группы, по которой кликнули

  // опционально: после успешного создания
  onCreated?: (lesson: any) => void;
};

function parseTimeToMinutes(value: string): number | null {
  const s = value.trim();
  const mm = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!mm) return null;
  const h = parseInt(mm[1], 10);
  const m = parseInt(mm[2], 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function LessonForm({
  open,
  onOpenChange,
  batchId,
  date,
  groupId,
  onCreated,
}: Props) {
  const [startsAt, setStartsAt] = React.useState("10:00");
  const [endsAt, setEndsAt] = React.useState("11:00");
  const [roomId, setRoomId] = React.useState<string>("");
  const [subjectId, setSubjectId] = React.useState<string>("");
  const [teacherId, setTeacherId] = React.useState<string>("");

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // сброс формы при открытии
    if (open) {
      setStartsAt("10:00");
      setEndsAt("11:00");
      setRoomId("");
      setSubjectId("");
      setTeacherId("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const onSubmit = async () => {
    setError(null);

    const startMin = parseTimeToMinutes(startsAt);
    const endMin = parseTimeToMinutes(endsAt);

    if (startMin == null || endMin == null) {
      setError("Укажите время в формате ЧЧ:ММ, например 10:00 и 11:00.");
      return;
    }
    if (endMin <= startMin) {
      setError("Время окончания должно быть больше времени начала.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createDraftLesson({
        batchId,
        date,
        groupId,
        startsAtMin: startMin,
        endsAtMin: endMin,
        roomId: roomId ? Number(roomId) : null,
        subjectId: subjectId ? Number(subjectId) : null,
        teacherId: teacherId ? Number(teacherId) : null,
      });

      onOpenChange(false);
      if (onCreated) onCreated(created);
    } catch (e: any) {
      setError(e?.message || "Не удалось создать урок.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>Новое занятие</SheetTitle>
          <div className="text-sm text-muted-foreground">
            {format(date, "EEEE, d MMMM yyyy", { locale: ru })} • Группа #
            {groupId}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startsAt">Начало (ЧЧ:ММ)</Label>
              <Input
                id="startsAt"
                placeholder="10:00"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endsAt">Окончание (ЧЧ:ММ)</Label>
              <Input
                id="endsAt"
                placeholder="11:00"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="roomId">Комната (ID, опц.)</Label>
              <Input
                id="roomId"
                placeholder="например 5"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjectId">Предмет (ID, опц.)</Label>
              <Input
                id="subjectId"
                placeholder="например 3"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacherId">Преподаватель (ID, опц.)</Label>
              <Input
                id="teacherId"
                placeholder="например 8"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>

          {error && (
            <div
              className={cn(
                "rounded-md border p-2 text-sm",
                "border-destructive/50 text-destructive",
              )}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button onClick={onSubmit} disabled={submitting}>
              {submitting ? "Создание..." : "Создать"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
