// app/groups/new/page.tsx
import "server-only";
import * as React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionCasted } from "@/lib/session";
import { checkPermission } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GroupCreateForm } from "@/components/groups/group-create-form";
import { createGroupAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function GroupCreatePage() {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "group", "write", "all");

  const years = await prisma.academicYear.findMany({
    orderBy: [{ startsOn: "desc" }],
    select: { id: true, code: true, startsOn: true, endsOn: true },
  });

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Создать учебную группу</h1>
        <Button asChild variant="outline">
          <Link href="/groups">К списку</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новая группа</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupCreateForm action={createGroupAction} years={years} />
        </CardContent>
      </Card>
    </div>
  );
}
