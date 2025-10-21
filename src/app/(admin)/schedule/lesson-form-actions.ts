// app/(admin)/schedule/lesson-form-actions.ts
"use server";

import { prisma } from "@/lib/prisma";

/**
 * Возвращает опции для формы создания/редактирования урока:
 * - rooms: аудитории
 * - subjects: предметы
 * - teachers: преподаватели со списком subjectIds, которые они ведут
 */
export async function fetchLessonFormOptions() {
  // Аудитории
  const rooms = await prisma.room.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Предметы
  const subjects = await prisma.subject.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Преподаватели + их предметы (через StaffSubject)
  const teachersRaw = await prisma.staff.findMany({
    select: {
      id: true,
      person: {
        select: { lastName: true, firstName: true, middleName: true },
      },
      subjects: {
        select: { subjectId: true },
      },
    },
    orderBy: [
      { person: { lastName: "asc" } },
      { person: { firstName: "asc" } },
    ],
  });

  const teachers = teachersRaw.map((t) => {
    const p = t.person ?? { lastName: "", firstName: "", middleName: "" };
    const name =
      [p.lastName, p.firstName, p.middleName]
        .filter(Boolean)
        .join(" ")
        .trim() || `#${t.id}`;
    const subjectIds = t.subjects.map((s) => s.subjectId);
    return { id: t.id, name, subjectIds };
  });

  return { rooms, subjects, teachers };
}
