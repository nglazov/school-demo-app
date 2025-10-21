import { getSessionCasted } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { checkPermission } from "@/lib/rbac";
import { CreateBuildingForm } from "@/components/buildings/create-form";
import { createBuildingAction } from "@/app/buildings/new/actions";

export default async function BuildingsCreatePage() {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "room", "read", "all");

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Создать здание</h1>
        <Button variant="outline" asChild>
          <Link href="/buildings">К списку</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новое здание</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateBuildingForm action={createBuildingAction} />
        </CardContent>
      </Card>
    </div>
  );
}
