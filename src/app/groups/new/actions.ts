// app/groups/new/actions.ts
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionCasted } from "@/lib/session";
import { checkPermission } from "@/lib/rbac";
import { Prisma } from "@prisma/client";

const groupSchema = z.object({
  academicYearId: z.coerce.number().int().positive("Выберите учебный год"),
  name: z.string().trim().min(1, "Введите название"),
  key: z
    .string()
    .trim()
    .min(1, "Введите ключ")
    .regex(/^[a-z0-9._-]+$/i, "Допустимы: a-z, 0-9, . _ -"),
  gradeLevel: z
    .union([z.coerce.number().int().min(1), z.literal(""), z.null()])
    .transform((v) => (typeof v === "number" ? v : undefined))
    .optional(),
  track: z
    .string()
    .trim()
    .max(50, "Слишком длинный трек")
    .optional()
    .transform((v) => (v && v.length ? v : undefined)),
});

export async function createGroupAction(formData: FormData) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  // создание группы даём тем, кто может писать расписание
  await checkPermission(session.sub, "lesson", "write", "all");

  const raw = {
    academicYearId: formData.get("academicYearId"),
    name: formData.get("name"),
    key: formData.get("key"),
    gradeLevel: formData.get("gradeLevel"),
    track: formData.get("track"),
  };

  const parsed = groupSchema.safeParse(raw);
  if (!parsed.success) {
    const msg =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      "Ошибка валидации";
    throw new Error(msg);
  }

  try {
    const created = await prisma.eduGroup.create({
      data: {
        academicYearId: parsed.data.academicYearId,
        name: parsed.data.name,
        key: parsed.data.key,
        gradeLevel: parsed.data.gradeLevel ?? null,
        track: parsed.data.track ?? null,
      },
      select: { id: true },
    });

    revalidatePath("/groups");
    redirect(`/groups/${created.id}`);
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      // unique constraint — у EduGroup.key уникален
      throw new Error("Ключ группы уже используется");
    }
    throw e;
  }
}
