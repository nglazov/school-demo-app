// app/staff/[id]/page.tsx
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

function fullName(p?: {
  lastName: string;
  firstName: string;
  middleName: string | null;
}) {
  if (!p) return "—";
  return [p.lastName, p.firstName, p.middleName].filter(Boolean).join(" ");
}

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

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function weekdayLabel(w?: number | null) {
  if (w == null) return "—";
  // предполагаем 1..7 (Пн..Вс); если пришло 0..6 — тоже отобразим
  const idx = (w - 1 + 7) % 7;
  return WEEKDAYS[idx] ?? String(w);
}

export default async function StaffViewPage({ params }: PageProps) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "lesson", "read", "all");

  const { id } = await params;
  const staffId = Number(id);
  if (!Number.isFinite(staffId)) notFound();

  const now = new Date();

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      person: true,
      _count: { select: { lessons: true } },
      subjects: {
        include: { subject: true },
        orderBy: { subject: { name: "asc" } },
      },
      availabilities: {
        orderBy: [{ weekday: "asc" }, { startsAtMin: "asc" }],
      },
      exceptions: {
        orderBy: [{ date: "desc" }],
        take: 10,
      },
      lessons: {
        where: { date: { gte: now } },
        orderBy: [{ date: "asc" }, { startsAtMin: "asc" }],
        take: 10,
        include: {
          subject: true,
          group: true,
          room: { include: { building: true } },
        },
      },
    },
  });

  if (!staff) notFound();

  const subjects = staff.subjects.map((ss) => ss.subject).filter(Boolean);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Сотрудник: {fullName(staff.person)}
        </h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/staff">К списку</Link>
          </Button>
          <Button asChild>
            <Link href={`/staff/${staff.id}/edit`}>Редактировать</Link>
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
            <div className="text-sm text-muted-foreground">ФИО</div>
            <div className="font-medium">{fullName(staff.person)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Тип</div>
            <div className="font-medium">
              {staff.type === "TEACHER"
                ? "Преподаватель"
                : staff.type === "ADMIN"
                  ? "Администратор"
                  : staff.type === "SUPPORT"
                    ? "Сопровождение"
                    : "—"}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Контакты</div>
            <div className="text-sm">
              {staff.person?.phone ?? "—"}
              {staff.person?.email
                ? (staff.person?.phone ? " · " : "") + staff.person.email
                : ""}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Занятий</div>
            <div className="text-sm">{staff._count.lessons}</div>
          </div>
        </CardContent>
      </Card>

      {/* Предметы, которые может вести */}
      <Card>
        <CardHeader>
          <CardTitle>Предметы</CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Предметы не заданы.
            </div>
          ) : (
            <ul className="list-disc pl-5">
              {subjects.map((subj) => (
                <li key={subj.id}>
                  <Link
                    href={`/subjects/${subj.id}`}
                    className="hover:underline"
                  >
                    {subj.name}
                  </Link>{" "}
                  <span className="text-muted-foreground">({subj.code})</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Доступность (расписание по дням) */}
      <Card>
        <CardHeader>
          <CardTitle>Доступность</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.availabilities.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Доступность не задана.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>День</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Шаг</TableHead>
                  <TableHead>Период</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.availabilities.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{weekdayLabel(a.weekday)}</TableCell>
                    <TableCell>
                      {hhmm(a.startsAtMin)}–{hhmm(a.endsAtMin)}
                    </TableCell>
                    <TableCell>
                      каждые {a.intervalWeeks} нед., сдвиг {a.weekOffset}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.validFrom ? fmtDate(a.validFrom) : "—"} —{" "}
                      {a.validUntil ? fmtDate(a.validUntil) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Исключения (отгулы/болезни) */}
      <Card>
        <CardHeader>
          <CardTitle>Исключения (последние 10)</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.exceptions.length === 0 ? (
            <div className="text-sm text-muted-foreground">Нет данных.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Причина</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.exceptions.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{fmtDate(e.date)}</TableCell>
                    <TableCell className="text-sm">{e.reason ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ближайшие занятия как у преподавателя */}
      <Card>
        <CardHeader>
          <CardTitle>Ближайшие занятия (10)</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.lessons.length === 0 ? (
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
                  <TableHead>Комната</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.lessons.map((l) => {
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
                            href={`/groups/${l.group.id}`}
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
                            href={`/subjects/${l.subject.id}`}
                            className="hover:underline"
                          >
                            {l.subject.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{roomTitle}</TableCell>
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
