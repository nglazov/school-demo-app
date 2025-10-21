// app/subjects/new/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionCasted } from "@/lib/session";
import { checkPermission } from "@/lib/rbac";

const subjectSchema = z.object({
  name: z.string().trim().min(1, "Введите название"),
  code: z
    .string()
    .trim()
    .min(1, "Введите код")
    .regex(/^[a-zA-Z0-9._-]+$/, "Допустимы латиница, цифры, . _ -"),
});

export async function createSubjectAction(formData: FormData) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "subject", "write", "all");

  const raw = {
    name: formData.get("name"),
    code: formData.get("code"),
  };

  const parsed = subjectSchema.safeParse(raw);
  if (!parsed.success) {
    const msg =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      "Ошибка валидации";
    throw new Error(msg);
  }

  const created = await prisma.subject.create({
    data: parsed.data,
    select: { id: true },
  });

  revalidatePath("/subjects");
  redirect(`/subjects/${created.id}`);
}
