import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function getSession() {
  const token = (await cookies()).get("session")?.value;
  if (!token) return null;

  const secret = new TextEncoder().encode(
    process.env.SESSION_SECRET || "dev-secret-change-me",
  );
  try {
    const { payload } = await jwtVerify(token, secret);
    return { userId: Number(payload.sub), email: payload.username as string };
  } catch {
    return null;
  }
}
