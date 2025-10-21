// app/(admin)/schedule/lesson-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { startOfDay } from "date-fns";

// === Schema ===
const createDraftLessonSchema = z.object({
  batchId: z.number().int().positive(),
  date: z.coerce.date(), // Дата дня урока (время будет отброшено до начала суток)
  groupId: z.number().int().positive(),
  startsAtMin: z.number().int().min(0).max(1439),
  endsAtMin: z.number().int().min(1).max(1440),
  roomId: z.number().int().positive().nullable().optional(),
  subjectId: z.number().int().positive().nullable().optional(),
  teacherId: z.number().int().positive().nullable().optional(),
});

type CreateDraftLessonInput = z.infer<typeof createDraftLessonSchema>;

/**
 * Создаёт урок в текущем DRAFT-батче.
 * Проверки:
 *  - endsAtMin > startsAtMin
 *  - нет пересечений по времени в рамках ЭТОГО ЖЕ batchId и даты:
 *      * внутри той же группы
 *      * в той же комнате (если roomId указан)
 *      * у того же преподавателя (если teacherId указан)
 *  - (по желанию) можно расширить проверку на опубликованные уроки за этот день (batchId:null)
 */
export async function createDraftLesson(input: CreateDraftLessonInput) {
  const payload = createDraftLessonSchema.parse(input);

  if (payload.endsAtMin <= payload.startsAtMin) {
    throw new Error("Время окончания должно быть больше времени начала.");
  }

  const day = startOfDay(payload.date);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // — Проверка пересечений времени в рамках текущего черновика и дня —
    // Условие пересечения интервалов:
    // existing.startsAtMin < new.endsAtMin && existing.endsAtMin > new.startsAtMin
    const conflictWhereBase = {
      date: day,
      batchId: payload.batchId,
      startsAtMin: { lt: payload.endsAtMin },
      endsAtMin: { gt: payload.startsAtMin },
    } as const;

    const conflict = await tx.lesson.findFirst({
      where: {
        ...conflictWhereBase,
        OR: [
          { groupId: payload.groupId },
          ...(payload.roomId ? [{ roomId: payload.roomId }] : []),
          ...(payload.teacherId ? [{ teacherId: payload.teacherId }] : []),
        ],
      },
      select: {
        id: true,
        groupId: true,
        roomId: true,
        teacherId: true,
        startsAtMin: true,
        endsAtMin: true,
      },
    });

    if (conflict) {
      throw new Error(
        "Конфликт времени: выбранный интервал пересекается с существующим занятием в черновике.",
      );
    }

    // — (Опционально) Проверка пересечений с опубликованными уроками за этот день —
    // Раскомментируй, если нужно запрещать одновременные конфликты с PUBLISHED:
    /*
    const publishedConflict = await tx.lesson.findFirst({
      where: {
        ...conflictWhereBase,
        batchId: null,
        OR: [
          { groupId: payload.groupId },
          ...(payload.roomId ? [{ roomId: payload.roomId }] : []),
          ...(payload.teacherId ? [{ teacherId: payload.teacherId }] : []),
        ],
      },
      select: { id: true },
    });
    if (publishedConflict) {
      throw new Error("Конфликт с опубликованным расписанием за этот день.");
    }
    */

    // — Создание урока в DRAFT —
    const created = await tx.lesson.create({
      data: {
        date: day,
        groupId: payload.groupId,
        roomId: payload.roomId ?? null,
        subjectId: payload.subjectId ?? null,
        teacherId: payload.teacherId ?? null,
        startsAtMin: payload.startsAtMin,
        endsAtMin: payload.endsAtMin,
        batchId: payload.batchId,
      },
      include: {
        subject: true,
        teacher: { include: { person: true } },
        room: true,
        group: true,
      },
    });

    return created;
  });
}
