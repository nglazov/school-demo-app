import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect("/register"); // или /register

  return <main style={{ margin: 24 }}>Здравствуйте, {session.email}!</main>;
}
