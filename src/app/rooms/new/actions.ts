// app/rooms/new/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionCasted } from "@/lib/session";
import { checkPermission } from "@/lib/rbac";

const roomSchema = z.object({
  buildingId: z.coerce.number().int().positive("Выберите здание"),
  name: z.string().trim().min(1, "Введите название"),
  capacity: z
    .union([z.coerce.number().int().min(0), z.literal("")])
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  notes: z
    .string()
    .trim()
    .max(1000, "Слишком длинный текст")
    .optional()
    .transform((v) => (v && v.length ? v : undefined)),
});

export async function createRoomAction(formData: FormData) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  // см. примечание в page.tsx — пока read; когда добавишь — поставить write
  await checkPermission(session.sub, "room", "read", "all");

  const raw = {
    buildingId: formData.get("buildingId"),
    name: formData.get("name"),
    capacity: formData.get("capacity"),
    notes: formData.get("notes"),
  };

  const parsed = roomSchema.safeParse(raw);
  if (!parsed.success) {
    const msg =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      "Ошибка валидации";
    throw new Error(msg);
  }

  const created = await prisma.room.create({
    data: {
      buildingId: parsed.data.buildingId,
      name: parsed.data.name,
      capacity: parsed.data.capacity ?? null,
      notes: parsed.data.notes ?? null,
    },
    select: { id: true, buildingId: true },
  });

  // ревалидируем список комнат и страницу здания
  revalidatePath("/rooms");
  if (created.buildingId) revalidatePath(`/buildings/${created.buildingId}`);

  redirect(`/rooms/${created.id}`);
}
