// app/subjects/new/page.tsx
import "server-only";
import * as React from "react";
import Link from "next/link";
import { getSessionCasted } from "@/lib/session";
import { checkPermission } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubjectCreateForm } from "@/components/subjects/subject-create-form";
import { createSubjectAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SubjectCreatePage() {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "subject", "write", "all");

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Создать предмет</h1>
        <Button variant="outline" asChild>
          <Link href="/subjects">К списку</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новый предмет</CardTitle>
        </CardHeader>
        <CardContent>
          <SubjectCreateForm action={createSubjectAction} />
        </CardContent>
      </Card>
    </div>
  );
}
