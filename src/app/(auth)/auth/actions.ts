"use server";

import { prisma } from "@/lib/prisma";
import { setSession, clearSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const authSchema = z.object({
  username: z.string().min(3).max(64),
  password: z.string().min(3).max(128),
});

export type ActionState = { ok?: boolean; error?: string };

export async function signupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = authSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Некорректные данные" };

  const { username, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return { error: "Логин уже занят" };

  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
  const passwordHash = await bcrypt.hash(password, rounds);

  const user = await prisma.user.create({
    data: { username, passwordHash },
    select: { id: true, username: true },
  });

  await setSession({ sub: String(user.id), username: user.username });
  revalidatePath("/", "layout");
  redirect("/"); // успех -> переход
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = authSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: "Некорректные данные" };

  const { username, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return { error: "Неверные логин или пароль" };

  console.log(user);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: "Неверные логин или пароль" };

  await setSession({ sub: String(user.id), username: user.username });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  revalidatePath("/", "layout");
  redirect("/login");
}
