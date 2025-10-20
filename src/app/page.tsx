import { getSessionCasted } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EntityDashboard } from "@/components/dashboard/entity-dashboard";

// вспомогательная функция
async function getUserRoles(userId: number) {
  // пример, подстрой под твою схему RBAC
  const roles = await prisma.permission.findMany({
    where: {
      userGroups: { some: { userGroup: { userId } } },
    },
  });

  return roles;
}

export default async function DashboardPage() {
  const session = await getSessionCasted();
  if (!session) redirect("/login");

  const roles = await getUserRoles(session.sub);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Панель управления</h1>
      <EntityDashboard roles={roles} />
    </main>
  );
}
