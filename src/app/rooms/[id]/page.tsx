// app/rooms/[id]/page.tsx
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

function fmtInt(n: number | null | undefined) {
  return typeof n === "number" ? String(n) : "—";
}

export default async function RoomViewPage({ params }: PageProps) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "room", "read", "all");

  const { id } = await params;
  const roomId = Number(id);
  if (!Number.isFinite(roomId)) notFound();

  const now = new Date();

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      building: true,
      _count: { select: { capabilities: true, lessons: true } },
      capabilities: {
        include: {
          capability: true,
        },
        orderBy: { capability: { name: "asc" } },
      },
      lessons: {
        where: { date: { gte: now } },
        orderBy: [{ date: "asc" }, { startsAtMin: "asc" }],
        take: 10,
        include: {
          group: true,
          subject: true,
          teacher: {
            include: { person: true },
          },
        },
      },
    },
  });

  if (!room) notFound();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Комната: {room.name}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/rooms">К списку</Link>
          </Button>
          <Button asChild>
            <Link href={`/rooms/${room.id}/edit`}>Редактировать</Link>
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
            <div className="text-sm text-muted-foreground">Здание</div>
            <div className="font-medium">
              {room.building ? (
                <Link
                  href={`/buildings/${room.buildingId}`}
                  className="hover:underline"
                >
                  {room.building.name}
                </Link>
              ) : (
                "—"
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Вместимость</div>
            <div className="font-medium">{fmtInt(room.capacity)}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-sm text-muted-foreground">Заметки</div>
            <div className="font-medium">{room.notes ?? "—"}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Связи</div>
            <div className="text-sm">
              options: {room._count.capabilities} · lessons:{" "}
              {room._count.lessons}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Привязанные опции (Capabilities) */}
      <Card>
        <CardHeader>
          <CardTitle>Опции комнаты</CardTitle>
        </CardHeader>
        <CardContent>
          {room.capabilities.length === 0 ? (
            <div className="text-sm text-muted-foreground">Опций нет.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Ключ</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Значение</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {room.capabilities.map((rv) => (
                  <TableRow key={`${rv.roomId}-${rv.capabilityId}`}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/capabilities/${rv.capabilityId}`}
                        className="hover:underline"
                      >
                        {rv.capability.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {rv.capability.key}
                    </TableCell>
                    <TableCell>{rv.capability.valueType}</TableCell>
                    <TableCell className="text-sm">{fmtValue(rv)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ближайшие занятия в этой комнате */}
      <Card>
        <CardHeader>
          <CardTitle>Ближайшие занятия (10)</CardTitle>
        </CardHeader>
        <CardContent>
          {room.lessons.length === 0 ? (
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
                  <TableHead>Предмет</TableHead>
                  <TableHead>Преподаватель</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {room.lessons.map((l) => {
                  const hhmm = (m: number) => {
                    const h = Math.floor(m / 60);
                    const mm = String(m % 60).padStart(2, "0");
                    return `${String(h).padStart(2, "0")}:${mm}`;
                  };
                  const teacherName = l.teacher?.person
                    ? [l.teacher.person.lastName, l.teacher.person.firstName]
                        .filter(Boolean)
                        .join(" ")
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
