// app/staff/page.tsx
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
  q?: string; // ФИО/телефон/email
  type?: "TEACHER" | "ADMIN" | "SUPPORT" | "";
};

type PageProps = {
  searchParams: Promise<PageSearch>;
};

function fullName(p?: {
  lastName: string;
  firstName: string;
  middleName: string | null;
}) {
  if (!p) return "—";
  return [p.lastName, p.firstName, p.middleName].filter(Boolean).join(" ");
}

export default async function StaffListPage({ searchParams }: PageProps) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "lesson", "read", "all");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const type = (sp.type ?? "") as PageSearch["type"];

  const items = await prisma.staff.findMany({
    where: {
      ...(type ? { type } : null),
      ...(q
        ? {
            OR: [
              { person: { firstName: { contains: q, mode: "insensitive" } } },
              { person: { lastName: { contains: q, mode: "insensitive" } } },
              { person: { middleName: { contains: q, mode: "insensitive" } } },
              { person: { phone: { contains: q, mode: "insensitive" } } },
              { person: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : null),
    },
    orderBy: [
      { person: { lastName: "asc" } },
      { person: { firstName: "asc" } },
      { id: "asc" },
    ],
    include: {
      person: true,
      // считаем занятия через _count, а количество предметов — через subjects.length
      _count: { select: { lessons: true } },
      subjects: { include: { subject: true } }, // junction StaffSubject[]
    },
    take: 300,
  });

  const typeLabel = (t?: string | null) =>
    t === "TEACHER"
      ? "Преподаватель"
      : t === "ADMIN"
        ? "Администратор"
        : t === "SUPPORT"
          ? "Сопровождение"
          : "—";

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Сотрудники</h1>
        <Button asChild>
          <Link href="/staff/new">Добавить сотрудника</Link>
        </Button>
      </div>

      {/* Фильтр */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтр</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-6"
            action="/staff"
            method="get"
          >
            <div className="grid gap-2 sm:col-span-3">
              <label htmlFor="q" className="text-sm font-medium">
                Поиск
              </label>
              <Input
                id="q"
                name="q"
                placeholder="ФИО, телефон или email…"
                defaultValue={q}
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <label htmlFor="type" className="text-sm font-medium">
                Тип
              </label>
              <select
                id="type"
                name="type"
                defaultValue={type ?? ""}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Любой</option>
                <option value="TEACHER">Преподаватель</option>
                <option value="ADMIN">Администратор</option>
                <option value="SUPPORT">Сопровождение</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button type="submit">Искать</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Таблица */}
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
                  <TableHead>Тип</TableHead>
                  <TableHead>Контакты</TableHead>
                  <TableHead>Предметы</TableHead>
                  <TableHead className="text-right">Занятий</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => {
                  const subjectsList = s.subjects
                    .map((ss) => ss.subject.name)
                    .join(", ");
                  const subjectsCount = s.subjects.length; // вместо _count.subjects
                  const contacts = [s.person?.phone, s.person?.email]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <TableRow key={s.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <Link
                          href={`/staff/${s.id}`}
                          className="hover:underline"
                        >
                          {fullName(s.person)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {typeLabel(s.type)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {contacts || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {subjectsList ? (
                          <span>
                            {subjectsList}{" "}
                            <span className="text-muted-foreground">
                              ({subjectsCount})
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {s._count.lessons}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
