import * as React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSessionCasted } from "@/lib/session";
import { checkPermission } from "@/lib/rbac";
import { SearchForm } from "@/components/capabilities/search-form";

export const dynamic = "force-dynamic";

export default async function CapabilityListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSessionCasted(); // или currentUser()
  if (!session?.sub) throw new Error("UNAUTHORIZED");

  // Проверка права просмотра capabilities
  await checkPermission(session.sub, "capability", "read");

  const q = ((await searchParams)?.q ?? "").trim();
  const items = await prisma.capability.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: [{ name: "asc" }],
    include: {
      _count: {
        select: {
          roomValues: true,
          subjRules: true,
        },
      },
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Capabilities</h1>
        <Button asChild>
          <Link href="/capabilities/new">Создать</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтр</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchForm q={q} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Ключ</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead className="text-right">Связи</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Link
                      className="font-medium hover:underline"
                      href={`/capabilities/${c.id}`}
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.key}
                  </TableCell>
                  <TableCell>{c.valueType}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    rooms: {c._count.roomValues} · rules: {c._count.subjRules}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
