// app/subjects/[id]/page.tsx
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

function opLabel(op: string) {
  switch (op) {
    case "REQUIRED":
      return "Требуется";
    case "PROHIBITED":
      return "Запрещено";
    case "EQUALS":
      return "Равно";
    case "IN":
      return "В списке";
    case "GTE":
      return "≥";
    case "LTE":
      return "≤";
    default:
      return op;
  }
}

function fmtValue(v: {
  boolValue: boolean | null;
  intValue: number | null;
  textValue: string | null;
}) {
  if (v.boolValue !== null && v.boolValue !== undefined)
    return v.boolValue ? "TRUE" : "FALSE";
  if (v.intValue !== null && v.intValue !== undefined)
    return String(v.intValue);
  if (v.textValue) return v.textValue;
  return "—";
}

export default async function SubjectViewPage({ params }: PageProps) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "subject", "read", "all");

  const { id } = await params;
  const subjectId = Number(id);
  if (!Number.isFinite(subjectId)) notFound();

  const now = new Date();

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      _count: { select: { rules: true, lessons: true } },
      rules: {
        include: { capability: true },
        orderBy: [{ capability: { name: "asc" } }],
      },
      lessons: {
        where: { date: { gte: now } },
        orderBy: [{ date: "asc" }, { startsAtMin: "asc" }],
        take: 10,
        include: {
          group: true,
          room: { include: { building: true } },
          teacher: { include: { person: true } },
        },
      },
    },
  });

  if (!subject) notFound();

  const hhmm = (m: number) => {
    const h = Math.floor(m / 60);
    const mm = String(m % 60).padStart(2, "0");
    return `${String(h).padStart(2, "0")}:${mm}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Предмет: {subject.name}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/subjects">К списку</Link>
          </Button>
          <Button asChild>
            <Link href={`/subjects/${subject.id}/edit`}>Редактировать</Link>
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
            <div className="text-sm text-muted-foreground">Название</div>
            <div className="font-medium">{subject.name}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Код</div>
            <div className="font-mono">{subject.code}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Связи</div>
            <div className="text-sm">
              правил: {subject._count.rules} · занятий: {subject._count.lessons}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Правила capability для предмета */}
      <Card>
        <CardHeader>
          <CardTitle>Правила совместимости комнат</CardTitle>
        </CardHeader>
        <CardContent>
          {subject.rules.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Правил нет. Вы можете добавить их на странице редактирования
              предмета.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Опция (Capability)</TableHead>
                  <TableHead>Ключ</TableHead>
                  <TableHead>Оператор</TableHead>
                  <TableHead>Значение</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subject.rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <Link
                        className="hover:underline"
                        href={`/capabilities/${r.capabilityId}`}
                      >
                        {r.capability.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.capability.key}
                    </TableCell>
                    <TableCell>{opLabel(r.operator)}</TableCell>
                    <TableCell className="text-sm">{fmtValue(r)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ближайшие занятия по предмету */}
      <Card>
        <CardHeader>
          <CardTitle>Ближайшие занятия (10)</CardTitle>
        </CardHeader>
        <CardContent>
          {subject.lessons.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Запланированных занятий нет.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Группа</TableHead>
                  <TableHead>Комната</TableHead>
                  <TableHead>Преподаватель</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subject.lessons.map((l) => {
                  const teacherName = l.teacher?.person
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
                        {l.group ? (
                          <Link
                            href={`/groups/${l.groupId}`}
                            className="hover:underline"
                          >
                            {l.group.name}
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
                      <TableCell>{teacherName}</TableCell>
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
