// app/students/new/actions.ts
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionCasted } from "@/lib/session";
import { checkPermission } from "@/lib/rbac";

const personSchema = z.object({
  lastName: z.string().trim().min(1, "Введите фамилию"),
  firstName: z.string().trim().min(1, "Введите имя"),
  middleName: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length ? v : undefined)),
  birthDate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined))
    .refine((v) => !v || !Number.isNaN(v.getTime()), "Некорректная дата"),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length ? v : undefined)),
  email: z
    .string()
    .trim()
    .email("Некорректный email")
    .optional()
    .transform((v) => (v && v.length ? v : undefined)),
});

const studentSchema = z.object({
  externalId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length ? v : undefined)),
});

export async function createStudentAction(formData: FormData) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "student", "write", "all");

  const rawPerson = {
    lastName: String(formData.get("lastName") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    middleName: (formData.get("middleName") as string) ?? undefined,
    birthDate: (formData.get("birthDate") as string) ?? undefined,
    phone: (formData.get("phone") as string) ?? undefined,
    email: (formData.get("email") as string) ?? undefined,
  };

  const rawStudent = {
    externalId: (formData.get("externalId") as string) ?? undefined,
  };

  const p = personSchema.safeParse(rawPerson);
  if (!p.success) {
    const msg =
      Object.values(p.error.flatten().fieldErrors).flat()[0] ??
      "Ошибка валидации персональных данных";
    throw new Error(msg);
  }

  const s = studentSchema.safeParse(rawStudent);
  if (!s.success) {
    const msg =
      Object.values(s.error.flatten().fieldErrors).flat()[0] ??
      "Ошибка валидации данных студента";
    throw new Error(msg);
  }

  const created = await prisma.$transaction(async (tx) => {
    const person = await tx.person.create({
      data: {
        lastName: p.data.lastName,
        firstName: p.data.firstName,
        middleName: p.data.middleName ?? null,
        birthDate: p.data.birthDate ?? null,
        phone: p.data.phone ?? null,
        email: p.data.email ?? null,
      },
      select: { id: true },
    });

    const student = await tx.student.create({
      data: {
        personId: person.id,
        externalId: s.data.externalId ?? null,
      },
      select: { id: true },
    });

    return student;
  });

  revalidatePath("/students");
  redirect(`/students/${created.id}`);
}
