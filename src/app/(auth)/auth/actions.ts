"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { redirect } from "next/navigation";
import { z } from "zod";

const secret = () =>
  new TextEncoder().encode(
    process.env.SESSION_SECRET || "dev-secret-change-me",
  );

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(128),
  next: z.string().optional().default("/"),
});

const signupSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, "Допустимы буквы/цифры/._-"),
  password: z.string().min(8).max(128),
  next: z.string().optional().default("/"),
});

async function setSessionCookie(payload: { sub: string; username: string }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  (await cookies()).set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function loginAction(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    username: String(formData.get("username") || "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") || ""),
    next: String(formData.get("next") || "/"),
  });
  if (!parsed.success) return { ok: false, message: "Неверные данные формы" };
  const { username, password, next } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return { ok: false, message: "Неверные учётные данные" };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { ok: false, message: "Неверные учётные данные" };

  await setSessionCookie({ sub: String(user.id), username: user.username });
  redirect(next || "/");
}

export async function signupAction(_: unknown, formData: FormData) {
  const parsed = signupSchema.safeParse({
    username: String(formData.get("username") || "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") || ""),
    next: String(formData.get("next") || "/"),
  });
  if (!parsed.success) return { ok: false, message: "Неверные данные формы" };
  const { username, password, next } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return { ok: false, message: "Имя занято" };

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, passwordHash },
    select: { id: true, username: true },
  });

  await setSessionCookie({ sub: String(user.id), username: user.username });
  redirect(next || "/");
}
