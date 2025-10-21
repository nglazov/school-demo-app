// app/staff/new/page.tsx
import "server-only";
import * as React from "react";
import Link from "next/link";
import { getSessionCasted } from "@/lib/session";
import { checkPermission } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StaffCreateForm } from "@/components/staff/staff-create-form";
import { createStaffAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function StaffCreatePage() {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "staff", "write", "all");

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Создать сотрудника</h1>
        <Button asChild variant="outline">
          <Link href="/staff">К списку</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новый сотрудник</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffCreateForm action={createStaffAction} />
        </CardContent>
      </Card>
    </div>
  );
}
