"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { redirect } from "next/navigation";

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
});

export async function registerAction(_: unknown, formData: FormData) {
    // 1) Парсим и валидируем поля
    const data = schema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
    });
    if (!data.success) {
        return { ok: false, message: "Неверные данные формы" };
    }
    const { email, password } = data.data;

    // 2) Проверяем дубликаты
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
        return { ok: false, message: "Пользователь уже существует" };
    }

    // 3) Хэш пароля
    const passwordHash = await bcrypt.hash(password, 12);

    // 4) Создаём пользователя
    const user = await prisma.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true, createdAt: true },
    });

    // 5) Сессия: ставим httpOnly cookie с подписью (упрощённый JWT)
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-change-me");
    const token = await new SignJWT({ sub: String(user.id), email: user.email })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);

    (await cookies()).set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    // 6) Редирект после успеха
    redirect("/dashboard");
}
