// app/staff/new/actions.ts
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionCasted } from "@/lib/session";
import { checkPermission } from "@/lib/rbac";

// Zod v4: перечисление литералами
const staffSchema = z.object({
  firstName: z.string().trim().min(1, "Введите имя"),
  lastName: z.string().trim().min(1, "Введите фамилию"),
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
  type: z.enum(["TEACHER", "ADMIN", "SUPPORT"] as const, {
    errorMap: () => ({ message: "Выберите тип сотрудника" }),
  }),
});

export async function createStaffAction(formData: FormData) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");

  // право на создание сотрудников: используем "lesson:write:all"
  await checkPermission(session.sub, "lesson", "write", "all");

  const raw = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    middleName: (formData.get("middleName") as string) ?? undefined,
    birthDate: (formData.get("birthDate") as string) ?? undefined,
    phone: (formData.get("phone") as string) ?? undefined,
    email: (formData.get("email") as string) ?? undefined,
    type: (formData.get("type") as string) ?? "",
  };

  const parsed = staffSchema.safeParse(raw);
  if (!parsed.success) {
    const msg =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      "Ошибка валидации";
    throw new Error(msg);
  }

  // Создаём Person -> Staff (personId уникален в Staff)
  const created = await prisma.$transaction(async (tx) => {
    const person = await tx.person.create({
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        middleName: parsed.data.middleName ?? null,
        birthDate: parsed.data.birthDate ?? null,
        phone: parsed.data.phone ?? null,
        email: parsed.data.email ?? null,
      },
      select: { id: true },
    });

    const staff = await tx.staff.create({
      data: {
        personId: person.id,
        type: parsed.data.type,
      },
      select: { id: true },
    });

    return staff;
  });

  revalidatePath("/staff");
  redirect(`/staff/${created.id}`);
}
