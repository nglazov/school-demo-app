// app/groups/[id]/page.tsx
import "server-only";
import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionCasted } from "@/lib/session";
import { checkPermission } from "@/lib/rbac";
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

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function fmtDate(d?: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function hhmm(totalMin: number) {
  const h = Math.floor(totalMin / 60);
  const m = String(totalMin % 60).padStart(2, "0");
  return `${String(h).padStart(2, "0")}:${m}`;
}

export default async function GroupViewPage({ params }: PageProps) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "lesson", "read", "all");

  const { id } = await params;
  const groupId = Number(id);
  if (!Number.isFinite(groupId)) notFound();

  const now = new Date();

  const group = await prisma.eduGroup.findUnique({
    where: { id: groupId },
    include: {
      academicYear: true,
      _count: { select: { memberships: true, lessons: true } },
      memberships: {
        orderBy: [{ since: "desc" }],
        include: {
          student: { include: { person: true } },
        },
      },
      lessons: {
        where: { date: { gte: now } },
        orderBy: [{ date: "asc" }, { startsAtMin: "asc" }],
        take: 10,
        include: {
          subject: true,
          room: { include: { building: true } },
          teacher: { include: { person: true } },
        },
      },
    },
  });

  if (!group) notFound();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Группа: {group.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/groups">К списку</Link>
          </Button>
          <Button asChild>
            <Link href={`/groups/${group.id}/edit`}>Редактировать</Link>
          </Button>
        </div>
      </div>

      {/* Общая информация */}
      <Card>
        <CardHeader>
          <CardTitle>Общая информация</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Учебный год</div>
            <div className="font-medium">
              {group.academicYear ? (
                <Link
                  href={`/academic-years/${group.academicYearId}`}
                  className="hover:underline"
                >
                  {group.academicYear.code}
                </Link>
              ) : (
                "—"
              )}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Ключ</div>
            <div className="font-mono">{group.key}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Класс (уровень)</div>
            <div className="font-medium">{group.gradeLevel ?? "—"}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Трек</div>
            <div className="font-medium">{group.track ?? "—"}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Связи</div>
            <div className="text-sm">
              учеников: {group._count.memberships} · занятий:{" "}
              {group._count.lessons}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ученики группы */}
      <Card>
        <CardHeader>
          <CardTitle>Состав группы</CardTitle>
        </CardHeader>
        <CardContent>
          {group.memberships.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Пока никто не состоит в группе.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ученик</TableHead>
                  <TableHead>С</TableHead>
                  <TableHead>По</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.memberships.map((m) => {
                  const p = m.student?.person;
                  const fio = p
                    ? [p.lastName, p.firstName, p.middleName]
                        .filter(Boolean)
                        .join(" ")
                    : `#${m.studentId}`;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/students/${m.studentId}`}
                          className="hover:underline"
                        >
                          {fio}
                        </Link>
                      </TableCell>
                      <TableCell>{fmtDate(m.since)}</TableCell>
                      <TableCell>{fmtDate(m.until)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ближайшие занятия */}
      <Card>
        <CardHeader>
          <CardTitle>Ближайшие занятия (10)</CardTitle>
        </CardHeader>
        <CardContent>
          {group.lessons.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Запланированных занятий нет.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Предмет</TableHead>
                  <TableHead>Комната</TableHead>
                  <TableHead>Преподаватель</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.lessons.map((l) => {
                  const teacher = l.teacher?.person
                    ? [l.teacher.person.lastName, l.teacher.person.firstName]
                        .filter(Boolean)
                        .join(" ")
                    : "—";
                  const roomTitle = l.room
                    ? `${l.room.name}${l.room.building ? `, ${l.room.building.name}` : ""}`
                    : "—";

                  return (
                    <TableRow key={l.id}>
                      <TableCell>
                        {new Date(l.date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        {hhmm(l.startsAtMin)}–{hhmm(l.endsAtMin)}
                      </TableCell>
                      <TableCell>
                        {l.subject ? (
                          <Link
                            href={`/subjects/${l.subjectId}`}
                            className="hover:underline"
                          >
                            {l.subject.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {l.room ? (
                          <Link
                            href={`/rooms/${l.roomId}`}
                            className="hover:underline"
                          >
                            {roomTitle}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{teacher}</TableCell>
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
