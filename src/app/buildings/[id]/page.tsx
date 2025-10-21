// app/buildings/[id]/page.tsx
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

function fmt(n?: number | null) {
  return typeof n === "number" ? String(n) : "—";
}

export default async function BuildingViewPage({ params }: PageProps) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");

  // доступ как и на список/создание — по праву чтения комнат
  await checkPermission(session.sub, "room", "read", "all");

  const { id } = await params;
  const buildingId = Number(id);
  if (!Number.isFinite(buildingId)) notFound();

  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    include: {
      _count: { select: { rooms: true } },
      rooms: {
        orderBy: [{ name: "asc" }],
        include: {
          _count: { select: { capabilities: true, lessons: true } },
        },
      },
    },
  });

  if (!building) notFound();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Здание: {building.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/buildings">К списку</Link>
          </Button>
          <Button asChild>
            <Link href={`/rooms/new?buildingId=${building.id}`}>
              Добавить комнату
            </Link>
          </Button>
        </div>
      </div>

      {/* Общее */}
      <Card>
        <CardHeader>
          <CardTitle>Общая информация</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Название</div>
            <div className="font-medium">{building.name}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Адрес</div>
            <div className="font-medium">{building.address ?? "—"}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Комнат</div>
            <div className="font-medium">{building._count.rooms}</div>
          </div>
        </CardContent>
      </Card>

      {/* Комнаты */}
      <Card>
        <CardHeader>
          <CardTitle>Комнаты</CardTitle>
        </CardHeader>
        <CardContent>
          {building.rooms.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              В этом здании пока нет комнат.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead className="w-32">Вместимость</TableHead>
                  <TableHead>Заметки</TableHead>
                  <TableHead className="text-right">Опций</TableHead>
                  <TableHead className="text-right">Занятий</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {building.rooms.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <Link href={`/rooms/${r.id}`} className="hover:underline">
                        {r.name}
                      </Link>
                    </TableCell>
                    <TableCell>{fmt(r.capacity)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {r._count.capabilities}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {r._count.lessons}
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
