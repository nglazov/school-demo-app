import { getSessionCasted } from "@/lib/session";
import { checkPermission } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CreateCapabilityForm } from "@/components/capabilities/create-form";
import { createCapabilityAction } from "@/app/capabilities/new/actions";
import { Button } from "@/components/ui/button";

export default async function CapabilityCreatePage() {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "capability", "write", "all");

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Создать Capability</h1>
        <Button variant="outline" asChild>
          <Link href="/capabilities">Назад к списку</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новая Capability</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCapabilityForm action={createCapabilityAction} />
        </CardContent>
      </Card>
    </div>
  );
}
