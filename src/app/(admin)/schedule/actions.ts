// app/(admin)/schedule/actions.ts
"use server";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { addDays, endOfDay, startOfDay, startOfWeek } from "date-fns";
import { z } from "zod";

// === Schemas ===
const weekQuerySchema = z.object({
  weekStart: z.coerce.date(),
  groupIds: z.array(z.number().int().positive()).min(1),
  includeDraft: z.boolean().optional(),
});

const startDraftSchema = z.object({
  weekStart: z.coerce.date(),
  groupIds: z.array(z.number().int().positive()).min(1),
});

const batchIdSchema = z.object({ batchId: z.number().int().positive() });

// === utils ===
function minutesToDate(baseDate: Date, minutes: number) {
  const d = new Date(baseDate);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  d.setHours(h, m, 0, 0);
  return d;
}

// === Actions ===
export async function fetchEduGroups() {
  return prisma.eduGroup.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Допущения по модели:
 * - Опубликованные уроки: lesson.batchId = null
 * - Черновик: lesson.batchId = <id LessonBatch>
 * - Поля времени: startsAtMin (int), endsAtMin (int)
 * - Дата: date (Date)
 */
export async function fetchWeekLessons(input: z.infer<typeof weekQuerySchema>) {
  const { weekStart, groupIds, includeDraft } = weekQuerySchema.parse(input);
  const from = startOfDay(weekStart);
  const to = endOfDay(addDays(weekStart, 6));

  // есть ли черновые уроки за эту неделю для выбранных групп
  const anyDraftLesson = await prisma.lesson.findFirst({
    where: {
      batchId: { not: null },
      groupId: { in: groupIds },
      date: { gte: from, lte: to },
    },
    select: { batchId: true },
    orderBy: { id: "desc" },
  });

  const useDraftId =
    includeDraft && anyDraftLesson?.batchId ? anyDraftLesson.batchId : null;

  const lessons = await prisma.lesson.findMany({
    where: useDraftId
      ? {
          batchId: useDraftId,
          groupId: { in: groupIds },
          date: { gte: from, lte: to },
        }
      : {
          batchId: null,
          groupId: { in: groupIds },
          date: { gte: from, lte: to },
        },
    include: {
      subject: true,
      teacher: { include: { person: true } },
      room: true,
      group: true,
    },
    orderBy: [{ date: "asc" }, { startsAtMin: "asc" }],
  });

  return {
    lessons: lessons.map((row) => {
      const startAt = minutesToDate(
        new Date(row.date),
        typeof row.startsAtMin === "number" ? row.startsAtMin : 600,
      );
      const endAt = minutesToDate(
        new Date(row.date),
        typeof row.endsAtMin === "number" ? row.endsAtMin : 660,
      );
      return { ...row, startAt, endAt };
    }),
    draftBatchId: useDraftId ?? null,
  };
}

export async function startDraft(input: z.infer<typeof startDraftSchema>) {
  const { weekStart, groupIds } = startDraftSchema.parse(input);
  const from = startOfDay(weekStart);
  const to = endOfDay(addDays(weekStart, 6));

  // Возвращаем ID созданного батча
  return prisma.$transaction(
    async (tx: Prisma.TransactionClient): Promise<number> => {
      // 1) создаём пустой батч (в модели LessonBatch нет обязательных полей)
      const batch = await tx.lessonBatch.create({
        data: { key: randomUUID() }, // обязателен для твоей схемы
      });

      // 2) читаем опубликованные уроки за неделю (batchId:null)
      const baseLessons = await tx.lesson.findMany({
        where: {
          batchId: null,
          groupId: { in: groupIds },
          date: { gte: from, lte: to },
        },
        select: {
          date: true,
          groupId: true,
          roomId: true,
          subjectId: true,
          teacherId: true,
          startsAtMin: true,
          endsAtMin: true,
        },
      });

      // 3) если данных нет — просто возвращаем пустой черновик
      if (baseLessons.length === 0) {
        return batch.id;
      }

      // 4) готовим данные для createMany — БЕЗ startTime/time, только minutes
      const data = baseLessons.map((l) => ({
        date: l.date,
        groupId: l.groupId,
        roomId: l.roomId ?? null,
        subjectId: l.subjectId ?? null,
        teacherId: l.teacherId ?? null,
        startsAtMin: typeof l.startsAtMin === "number" ? l.startsAtMin : 600, // дефолт 10:00
        endsAtMin: typeof l.endsAtMin === "number" ? l.endsAtMin : 660, // дефолт 11:00
        batchId: batch.id,
      }));

      await tx.lesson.createMany({ data, skipDuplicates: true });

      return batch.id;
    },
  );
}

export async function discardDraft(input: z.infer<typeof batchIdSchema>) {
  const { batchId } = batchIdSchema.parse(input);
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.lesson.deleteMany({ where: { batchId } });
    await tx.lessonBatch.delete({ where: { id: batchId } });
  });
}

export async function publishDraft(input: z.infer<typeof batchIdSchema>) {
  const { batchId } = batchIdSchema.parse(input);

  const draftLessons = await prisma.lesson.findMany({
    where: { batchId },
    select: { groupId: true, date: true },
  });

  if (draftLessons.length === 0) {
    await prisma.lessonBatch.delete({ where: { id: batchId } });
    return;
  }

  const groupIds = Array.from(
    new Set(draftLessons.map((l) => l.groupId).filter((item) => item !== null)),
  );
  const inferredWeekStart = startOfWeek(draftLessons[0].date, {
    weekStartsOn: 1,
  });
  const from = startOfDay(inferredWeekStart);
  const to = endOfDay(addDays(inferredWeekStart, 6));

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1) удаляем опубликованные уроки за неделю (batchId:null) для групп
    await tx.lesson.deleteMany({
      where: {
        batchId: null,
        groupId: { in: groupIds },
        date: { gte: from, lte: to },
      },
    });

    // 2) переносим черновые как опубликованные (batchId:null)
    const drafts = await tx.lesson.findMany({
      where: { batchId },
      select: {
        date: true,
        groupId: true,
        roomId: true,
        subjectId: true,
        teacherId: true,
        startsAtMin: true,
        endsAtMin: true,
      },
    });

    if (drafts.length > 0) {
      await tx.lesson.createMany({
        data: drafts.map((l) => ({
          date: l.date,
          groupId: l.groupId,
          roomId: l.roomId ?? null,
          subjectId: l.subjectId ?? null,
          teacherId: l.teacherId ?? null,
          startsAtMin: l.startsAtMin ?? 600,
          endsAtMin: l.endsAtMin ?? 660,
          batchId: null,
        })),
      });
    }

    // 3) чистим черновик
    await tx.lesson.deleteMany({ where: { batchId } });
    await tx.lessonBatch.delete({ where: { id: batchId } });
  });
}
