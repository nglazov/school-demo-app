import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect("/auth"); // или /register

  return <main style={{ margin: 24 }}>Здравствуйте, {session.email}!</main>;
}
