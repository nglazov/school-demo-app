// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ✳️ Пути, доступные без авторизации
const PUBLIC_PATHS = new Set([
  "/auth", // общая страница логин/сайнап
  "/favicon.ico",
  "/robots.txt",
]);

// ✳️ Префиксы, которые пропускаем без проверки (статика/публичные API)
const PUBLIC_PREFIXES = [
  "/_next", // ассеты Next.js
  "/assets", // твои статики (если есть)
  "/images",
  "/api/public", // публичные API
  "/api/health", // healthcheck
];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  // читаем JWT из httpOnly-куки
  const token = req.cookies.get("session")?.value;
  if (!token) {
    const url = new URL("/auth", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.SESSION_SECRET || "dev-secret-change-me",
    );
    await jwtVerify(token, secret); // валидируем подпись и exp
    return NextResponse.next();
  } catch {
    const url = new URL("/auth", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
}

// ✳️ Матчер: пускаем через middleware весь трафик (фильтруем внутри)
export const config = {
  matcher: ["/:path*"],
};
