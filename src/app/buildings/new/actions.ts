import { z } from "zod";
import { getSessionCasted } from "@/lib/session";
import { checkPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const buildingSchema = z.object({
  name: z.string().trim().min(1, "Введите название"),
  address: z
    .string()
    .trim()
    .max(500, "Слишком длинный адрес")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

// --- server action ---
export async function createBuildingAction(formData: FormData) {
  "use server";

  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");

  // Пока проверяем право чтения комнат (как и на списке).
  // Когда добавишь право `room:write:all` — поменяй здесь на write.
  await checkPermission(session.sub, "room", "read", "all");

  const raw = {
    name: String(formData.get("name") ?? ""),
    address: (formData.get("address") ?? undefined) as string | undefined,
  };

  const parsed = buildingSchema.safeParse(raw);
  if (!parsed.success) {
    const msg =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      "Ошибка валидации";
    throw new Error(msg);
  }

  const created = await prisma.building.create({
    data: {
      name: parsed.data.name,
      address: parsed.data.address ?? null,
    },
    select: { id: true },
  });

  revalidatePath("/buildings");
  redirect(`/buildings/${created.id}`);
}
