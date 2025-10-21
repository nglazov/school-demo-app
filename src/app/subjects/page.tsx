// app/subjects/page.tsx
import "server-only";
import * as React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionCasted } from "@/lib/session";
import { checkPermission } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SubjectsListPage({ searchParams }: PageProps) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "subject", "read", "all");

  const q = ((await searchParams)?.q ?? "").trim();

  const items = await prisma.subject.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { rules: true, lessons: true },
      },
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Предметы</h1>
        <Button asChild>
          <Link href="/subjects/new">Создать предмет</Link>
        </Button>
      </div>

      {/* ===== Фильтр ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтр</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" action="/subjects" method="get">
            <Input name="q" placeholder="Поиск по названию…" defaultValue={q} />
            <Button type="submit">Искать</Button>
            {q && (
              <Button asChild variant="ghost">
                <Link href="/subjects">Сброс</Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* ===== Таблица ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Список</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Ничего не найдено.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Код</TableHead>
                  <TableHead className="text-right">Правил</TableHead>
                  <TableHead className="text-right">Занятий</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Link
                        href={`/subjects/${s.id}`}
                        className="font-medium hover:underline"
                      >
                        {s.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {s.code}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {s._count.rules}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {s._count.lessons}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
