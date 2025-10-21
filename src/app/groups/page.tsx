// app/groups/page.tsx
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

type Search = {
  q?: string; // поиск по названию/ключу
  yearId?: string; // фильтр по учебному году
  track?: string; // фильтр по треку
  grade?: string; // фильтр по уровню (число)
};

type PageProps = {
  searchParams: Promise<Search>;
};

function toInt(v?: string) {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

export default async function GroupsListPage({ searchParams }: PageProps) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  // доступ к группам логично давать тем, кто может видеть уроки
  await checkPermission(session.sub, "lesson", "read", "all");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const yearId = toInt(sp.yearId);
  const track = (sp.track ?? "").trim();
  const grade = toInt(sp.grade);

  const years = await prisma.academicYear.findMany({
    orderBy: [{ startsOn: "desc" }],
    select: { id: true, code: true, startsOn: true, endsOn: true },
  });

  const groups = await prisma.eduGroup.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { key: { contains: q, mode: "insensitive" } },
            ],
          }
        : null),
      ...(yearId ? { academicYearId: yearId } : null),
      ...(track ? { track: { contains: track, mode: "insensitive" } } : null),
      ...(typeof grade === "number" ? { gradeLevel: grade } : null),
    },
    orderBy: [{ academicYear: { startsOn: "desc" } }, { name: "asc" }],
    include: {
      academicYear: true,
      _count: { select: { memberships: true, lessons: true } },
    },
    take: 300,
  });

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Учебные группы</h1>
        <Button asChild>
          <Link href="/groups/new">Создать группу</Link>
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
            action="/groups"
            method="get"
          >
            <div className="grid gap-2 sm:col-span-2">
              <label htmlFor="q" className="text-sm font-medium">
                Поиск
              </label>
              <Input
                id="q"
                name="q"
                placeholder="Название или ключ…"
                defaultValue={q}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="yearId" className="text-sm font-medium">
                Учебный год
              </label>
              <select
                id="yearId"
                name="yearId"
                defaultValue={yearId ?? ""}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Все</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="track" className="text-sm font-medium">
                Трек
              </label>
              <Input
                id="track"
                name="track"
                placeholder="напр.: A, B…"
                defaultValue={track}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="grade" className="text-sm font-medium">
                Класс (уровень)
              </label>
              <Input
                id="grade"
                name="grade"
                type="number"
                min={1}
                defaultValue={grade ?? ""}
              />
            </div>

            <div className="sm:col-span-2 flex items-end gap-2">
              <Button type="submit">Искать</Button>
              {(q || yearId || track || grade !== undefined) && (
                <Button asChild variant="ghost">
                  <Link href="/groups">Сброс</Link>
                </Button>
              )}
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
          {groups.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Ничего не найдено.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Год</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Ключ</TableHead>
                  <TableHead className="w-24 text-right">Класс</TableHead>
                  <TableHead>Трек</TableHead>
                  <TableHead className="w-24 text-right">Учеников</TableHead>
                  <TableHead className="w-24 text-right">Занятий</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => (
                  <TableRow key={g.id} className="hover:bg-muted/30">
                    <TableCell className="text-muted-foreground">
                      {g.academicYear ? (
                        <Link
                          href={`/academic-years/${g.academicYearId}`}
                          className="hover:underline"
                        >
                          {g.academicYear.code}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/groups/${g.id}`}
                        className="hover:underline"
                      >
                        {g.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {g.key}
                    </TableCell>
                    <TableCell className="text-right">
                      {g.gradeLevel ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {g.track ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {g._count.memberships}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {g._count.lessons}
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
