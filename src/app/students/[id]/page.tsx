// app/students/[id]/page.tsx
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

export default async function StudentViewPage({ params }: PageProps) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "student", "read", "all");

  const { id } = await params;
  const studentId = Number(id);
  if (!Number.isFinite(studentId)) notFound();

  // Основная сущность ученика
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      person: true,
      _count: {
        select: { families: true, groupMemberships: true },
      },
      families: {
        include: {
          family: {
            include: {
              // подтянем всех членов семьи, чтобы показать связанных опекунов и студентов
              members: {
                include: {
                  guardian: { include: { person: true } },
                  student: { include: { person: true } },
                },
              },
            },
          },
        },
        orderBy: [{ joinedAt: "desc" }],
      },
      groupMemberships: {
        include: {
          group: { include: { academicYear: true } },
        },
        orderBy: [{ since: "desc" }],
      },
    },
  });

  if (!student) notFound();

  // ближайшие занятия для всех групп ученика
  const now = new Date();
  const groupIds = student.groupMemberships.map((gm) => gm.groupId);
  const upcomingLessons = groupIds.length
    ? await prisma.lesson.findMany({
        where: { groupId: { in: groupIds }, date: { gte: now } },
        orderBy: [{ date: "asc" }, { startsAtMin: "asc" }],
        take: 10,
        include: {
          group: true,
          subject: true,
          room: { include: { building: true } },
          teacher: { include: { person: true } },
        },
      })
    : [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Ученик: {fullName(student.person)}
        </h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/students">К списку</Link>
          </Button>
          <Button asChild>
            <Link href={`/students/${student.id}/edit`}>Редактировать</Link>
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
            <div className="font-medium">{fullName(student.person)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Дата рождения</div>
            <div className="font-medium">
              {fmtDate(student.person?.birthDate ?? null)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Контакты</div>
            <div className="font-medium">
              {student.person?.phone ?? "—"}
              {student.person?.email
                ? (student.person?.phone ? " · " : "") + student.person.email
                : ""}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Внешний ID</div>
            <div className="font-mono">{student.externalId ?? "—"}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Связи</div>
            <div className="text-sm">
              семей: {student._count.families} · групп:{" "}
              {student._count.groupMemberships}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Семьи и опекуны */}
      <Card>
        <CardHeader>
          <CardTitle>Семьи и опекуны</CardTitle>
        </CardHeader>
        <CardContent>
          {student.families.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Связей с семьями нет.
            </div>
          ) : (
            student.families.map((fm) => {
              const guardians = fm.family.members
                .map((m) => m.guardian?.person)
                .filter(Boolean) as {
                firstName: string;
                lastName: string;
                middleName: string | null;
              }[];

              const students = fm.family.members
                .map((m) => m.student?.person)
                .filter(Boolean) as {
                firstName: string;
                lastName: string;
                middleName: string | null;
              }[];

              return (
                <div key={fm.id} className="mb-4">
                  <div className="font-medium">
                    Семья{" "}
                    {fm.family.name
                      ? `«${fm.family.name}»`
                      : `#${fm.family.key}`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Участников: {fm.family.members.length}
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Опекуны
                      </div>
                      <ul className="list-disc pl-5">
                        {guardians.length ? (
                          guardians.map((p, idx) => (
                            <li key={idx}>{fullName(p)}</li>
                          ))
                        ) : (
                          <li className="text-muted-foreground">—</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Дети</div>
                      <ul className="list-disc pl-5">
                        {students.length ? (
                          students.map((p, idx) => (
                            <li key={idx}>{fullName(p)}</li>
                          ))
                        ) : (
                          <li className="text-muted-foreground">—</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Членства в учебных группах */}
      <Card>
        <CardHeader>
          <CardTitle>Членства в учебных группах</CardTitle>
        </CardHeader>
        <CardContent>
          {student.groupMemberships.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Пока не состоит ни в одной группе.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Группа</TableHead>
                  <TableHead>Уч. год</TableHead>
                  <TableHead>С</TableHead>
                  <TableHead>По</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.groupMemberships.map((gm) => (
                  <TableRow key={gm.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/groups/${gm.groupId}`}
                        className="hover:underline"
                      >
                        {gm.group?.name ?? `#${gm.groupId}`}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {gm.group?.academicYear
                        ? gm.group.academicYear.code
                        : "—"}
                    </TableCell>
                    <TableCell>{fmtDate(gm.since)}</TableCell>
                    <TableCell>{fmtDate(gm.until)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ближайшие занятия (по группам студента) */}
      <Card>
        <CardHeader>
          <CardTitle>Ближайшие занятия (10)</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingLessons.length === 0 ? (
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
                  <TableHead>Преподаватель</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingLessons.map((l) => {
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
