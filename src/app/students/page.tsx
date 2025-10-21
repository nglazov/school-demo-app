// app/students/page.tsx
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

type PageSearch = {
  q?: string; // поиск по ФИО, телефону, email, externalId
};

type PageProps = {
  searchParams: Promise<PageSearch>;
};

function fullName(p: {
  lastName: string;
  firstName: string;
  middleName: string | null;
}) {
  return [p.lastName, p.firstName, p.middleName].filter(Boolean).join(" ");
}

export default async function StudentsListPage({ searchParams }: PageProps) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "student", "read", "all");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const items = await prisma.student.findMany({
    where: q
      ? {
          OR: [
            { externalId: { contains: q, mode: "insensitive" } },
            { person: { firstName: { contains: q, mode: "insensitive" } } },
            { person: { lastName: { contains: q, mode: "insensitive" } } },
            { person: { middleName: { contains: q, mode: "insensitive" } } },
            { person: { phone: { contains: q, mode: "insensitive" } } },
            { person: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      person: true,
      _count: {
        select: {
          families: true, // количество членств в семьях
          groupMemberships: true, // количество членств в учебных группах
        },
      },
    },
    orderBy: [
      { person: { lastName: "asc" } },
      { person: { firstName: "asc" } },
      { id: "asc" },
    ],
    take: 200, // защитимся от слишком больших выборок; при необходимости сделаем пагинацию
  });

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ученики</h1>
        <Button asChild>
          <Link href="/students/new">Создать ученика</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтр</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" action="/students" method="get">
            <Input
              name="q"
              placeholder="ФИО, телефон, email или внешний ID…"
              defaultValue={q}
            />
            <Button type="submit">Искать</Button>
            {q && (
              <Button asChild variant="ghost">
                <Link href="/students">Сброс</Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

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
                  <TableHead>ФИО</TableHead>
                  <TableHead>Контакты</TableHead>
                  <TableHead>Внешний ID</TableHead>
                  <TableHead className="text-right">Семей</TableHead>
                  <TableHead className="text-right">Групп</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <Link
                        href={`/students/${s.id}`}
                        className="hover:underline"
                      >
                        {s.person ? fullName(s.person) : `#${s.id}`}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.person?.phone ?? "—"}
                      {s.person?.email
                        ? (s.person?.phone ? " · " : "") + s.person.email
                        : ""}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {s.externalId ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {s._count.families}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {s._count.groupMemberships}
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
