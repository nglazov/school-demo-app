// components/schedule/lesson-form.tsx
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { createDraftLesson } from "@/app/(admin)/schedule/lesson-actions";
import { fetchLessonFormOptions } from "@/app/(admin)/schedule/lesson-form-actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  batchId: number;
  date: Date;
  groupId: number;

  onCreated?: (lesson: any) => void;
};

type RoomOpt = { id: number; name: string };
type SubjectOpt = { id: number; name: string };
type TeacherOpt = { id: number; name: string; subjectIds: number[] };

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
  // время
  const [startsAt, setStartsAt] = React.useState("10:00");
  const [endsAt, setEndsAt] = React.useState("11:00");

  // выборы
  const [roomId, setRoomId] = React.useState<string>("");
  const [subjectId, setSubjectId] = React.useState<string>("");
  const [teacherId, setTeacherId] = React.useState<string>("");

  // опции
  const [rooms, setRooms] = React.useState<RoomOpt[]>([]);
  const [subjects, setSubjects] = React.useState<SubjectOpt[]>([]);
  const [teachers, setTeachers] = React.useState<TeacherOpt[]>([]);

  // состояния
  const [loadingOpts, setLoadingOpts] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // загрузка опций при открытии
  React.useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingOpts(true);
      setError(null);
      try {
        const { rooms, subjects, teachers } = await fetchLessonFormOptions();
        setRooms(rooms);
        setSubjects(subjects);
        setTeachers(teachers);
      } catch (e: any) {
        setError(e?.message ?? "Не удалось загрузить параметры формы.");
      } finally {
        setLoadingOpts(false);
      }
    })();

    // сброс значений
    setStartsAt("10:00");
    setEndsAt("11:00");
    setRoomId("");
    setSubjectId("");
    setTeacherId("");
  }, [open]);

  // фильтрация
  const filteredTeachers = React.useMemo(() => {
    if (!subjectId) return teachers;
    const sid = Number(subjectId);
    return teachers.filter((t) => t.subjectIds.includes(sid));
  }, [teachers, subjectId]);

  const filteredSubjects = React.useMemo(() => {
    if (!teacherId) return subjects;
    const tid = Number(teacherId);
    const t = teachers.find((x) => x.id === tid);
    if (!t) return subjects;
    const allowed = new Set(t.subjectIds);
    return subjects.filter((s) => allowed.has(s.id));
  }, [subjects, teacherId, teachers]);

  const handleSelectSubject = (val: string) => {
    const v = val === "none" ? "" : val;
    setSubjectId(v);
    if (v && teacherId) {
      const sid = Number(v);
      const tid = Number(teacherId);
      const t = teachers.find((x) => x.id === tid);
      if (t && !t.subjectIds.includes(sid)) {
        setTeacherId("");
      }
    }
  };

  const handleSelectTeacher = (val: string) => {
    const v = val === "none" ? "" : val;
    setTeacherId(v);
    if (v && subjectId) {
      const tid = Number(v);
      const sid = Number(subjectId);
      const t = teachers.find((x) => x.id === tid);
      if (t && !t.subjectIds.includes(sid)) {
        setSubjectId("");
      }
    }
  };

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
      onCreated?.(created);
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

        {/* карточка */}
        <div className="mt-4 rounded-2xl border bg-card p-4 shadow-sm">
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

          <div className="mt-4 grid gap-3">
            {/* Аудитория */}
            <div className="space-y-2">
              <Label>Аудитория</Label>
              <Select
                value={roomId || "none"}
                onValueChange={(val) => setRoomId(val === "none" ? "" : val)}
                disabled={loadingOpts}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выбрать аудиторию (опционально)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Нет —</SelectItem>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Предмет */}
            <div className="space-y-2">
              <Label>Предмет</Label>
              <Select
                value={subjectId || "none"}
                onValueChange={handleSelectSubject}
                disabled={loadingOpts}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выбрать предмет (опционально)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Нет —</SelectItem>
                  {filteredSubjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Преподаватель */}
            <div className="space-y-2">
              <Label>Преподаватель</Label>
              <Select
                value={teacherId || "none"}
                onValueChange={handleSelectTeacher}
                disabled={loadingOpts}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выбрать преподавателя (опционально)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Нет —</SelectItem>
                  {filteredTeachers.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div
              className={cn(
                "mt-4 rounded-md border p-2 text-sm",
                "border-destructive/50 text-destructive",
              )}
            >
              {error}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
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
