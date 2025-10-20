export function jwtSecret(): Uint8Array {
  const val = process.env.SESSION_SECRET;
  if (!val || val.trim() === "") {
    throw new Error("SESSION_SECRET is empty. Set it in .env");
  }
  return new TextEncoder().encode(val);
}
