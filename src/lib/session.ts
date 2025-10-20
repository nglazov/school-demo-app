import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "session";
const ALG = "HS256";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

export type Session = { sub: string; username: string; roles?: string[] };

export async function setSession(payload: Session) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  (await cookies()).set({
    name: COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  (await cookies()).set(COOKIE, "", { path: "/", maxAge: 0 });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as Session;
  } catch {
    return null;
  }
}
