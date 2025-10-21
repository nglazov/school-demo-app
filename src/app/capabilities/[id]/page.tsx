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

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CapabilityViewPage({ params }: PageProps) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "capability", "read", "all");

  const { id } = await params;
  const capabilityId = Number(id);
  if (!Number.isFinite(capabilityId)) notFound();

  const capability = await prisma.capability.findUnique({
    where: { id: capabilityId },
    include: {
      _count: { select: { roomValues: true, subjRules: true } },
      roomValues: {
        include: {
          room: {
            include: { building: true },
          },
        },
        orderBy: [{ room: { buildingId: "asc" } }, { room: { name: "asc" } }],
      },
      subjRules: {
        include: {
          subject: true,
        },
        orderBy: [{ subject: { name: "asc" } }],
      },
    },
  });

  if (!capability) notFound();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Capability: {capability.name}
        </h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/capabilities">К списку</Link>
          </Button>
          <Button asChild>
            <Link href={`/capabilities/${capability.id}/edit`}>
              Редактировать
            </Link>
          </Button>
        </div>
      </div>

      {/* Основная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Общее</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Название</div>
            <div className="font-medium">{capability.name}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Ключ</div>
            <div className="font-mono">{capability.key}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Тип значения</div>
            <div className="font-medium">{capability.valueType}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Связи</div>
            <div className="text-sm">
              rooms: {capability._count.roomValues} · rules:{" "}
              {capability._count.subjRules}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Комнаты с этой способностью */}
      <Card>
        <CardHeader>
          <CardTitle>Комнаты с этой опцией</CardTitle>
        </CardHeader>
        <CardContent>
          {capability.roomValues.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Нет связанных комнат.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Здание</TableHead>
                  <TableHead>Комната</TableHead>
                  <TableHead>Значение</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capability.roomValues.map((rv) => (
                  <TableRow key={`${rv.roomId}-${rv.capabilityId}`}>
                    <TableCell className="text-muted-foreground">
                      {rv.room.building?.name ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        className="hover:underline"
                        href={`/rooms/${rv.roomId}`}
                      >
                        {rv.room.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{fmtValue(rv)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Предметные правила */}
      <Card>
        <CardHeader>
          <CardTitle>Правила для предметов</CardTitle>
        </CardHeader>
        <CardContent>
          {capability.subjRules.length === 0 ? (
            <div className="text-sm text-muted-foreground">Правил нет.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Предмет</TableHead>
                  <TableHead>Оператор</TableHead>
                  <TableHead>Значение</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capability.subjRules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <Link
                        className="hover:underline"
                        href={`/subjects/${r.subjectId}`}
                      >
                        {r.subject.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {opLabel(r.operator)}
                    </TableCell>
                    <TableCell className="text-sm">{fmtValue(r)}</TableCell>
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
