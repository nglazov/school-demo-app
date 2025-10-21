"use server";

import { CapabilityValueType, Prisma } from "@prisma/client";
import { getSessionCasted } from "@/lib/session";
import { checkPermission } from "@/lib/rbac";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const createCapabilitySchema = z.object({
  name: z.string().min(1, "Введите название"),
  key: z
    .string()
    .min(1, "Введите ключ")
    .regex(/^[a-z0-9._-]+$/, "Допустимы: a-z, 0-9, . _ -"),
  valueType: z.nativeEnum(CapabilityValueType, {
    message: "Выберите тип значения",
  }),
});

export async function createCapabilityAction(formData: FormData) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "capability", "write", "all");

  const raw = {
    name: String(formData.get("name") ?? ""),
    key: String(formData.get("key") ?? ""),
    valueType: String(formData.get("valueType") ?? "") as CapabilityValueType,
  };

  const parsed = createCapabilitySchema.safeParse(raw);
  if (!parsed.success) {
    const firstErr =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      "Validation error";
    throw new Error(firstErr);
  }

  try {
    const created = await prisma.capability.create({
      data: parsed.data,
      select: { id: true },
    });

    revalidatePath("/capabilities");
    redirect(`/capabilities/${created.id}`);
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      // unique constraint on key
      throw new Error("Ключ уже используется");
    }
    throw e;
  }
}
