// app/rooms/page.tsx
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
  q?: string;
  buildingId?: string;
  minCap?: string;
  maxCap?: string;
};

type PageProps = {
  searchParams: Promise<PageSearch>;
};

function parseIntOrUndefined(v?: string) {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

export default async function RoomsListPage({ searchParams }: PageProps) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  await checkPermission(session.sub, "room", "read", "all");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const buildingId = parseIntOrUndefined(sp.buildingId);
  const minCap = parseIntOrUndefined(sp.minCap);
  const maxCap = parseIntOrUndefined(sp.maxCap);

  // для селектора зданий
  const buildings = await prisma.building.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const items = await prisma.room.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { notes: { contains: q, mode: "insensitive" } },
            ],
          }
        : null),
      ...(buildingId ? { buildingId } : null),
      ...(typeof minCap === "number" || typeof maxCap === "number"
        ? {
            capacity: {
              ...(typeof minCap === "number" ? { gte: minCap } : null),
              ...(typeof maxCap === "number" ? { lte: maxCap } : null),
            },
          }
        : null),
    },
    orderBy: [{ building: { name: "asc" } }, { name: "asc" }],
    include: {
      building: true,
      _count: { select: { capabilities: true, lessons: true } },
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Комнаты</h1>
        <Button asChild>
          <Link href="/rooms/new">Создать комнату</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтр</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-6"
            action="/rooms"
            method="get"
          >
            <div className="sm:col-span-2 grid gap-2">
              <label htmlFor="q" className="text-sm font-medium">
                Поиск
              </label>
              <Input
                id="q"
                name="q"
                placeholder="Название или заметки…"
                defaultValue={q}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="buildingId" className="text-sm font-medium">
                Здание
              </label>
              <select
                id="buildingId"
                name="buildingId"
                defaultValue={buildingId ?? ""}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Все</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="minCap" className="text-sm font-medium">
                Мин. вместимость
              </label>
              <Input
                id="minCap"
                name="minCap"
                type="number"
                min={0}
                defaultValue={minCap ?? ""}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="maxCap" className="text-sm font-medium">
                Макс. вместимость
              </label>
              <Input
                id="maxCap"
                name="maxCap"
                type="number"
                min={0}
                defaultValue={maxCap ?? ""}
              />
            </div>

            <div className="sm:col-span-2 flex items-end gap-2">
              <Button type="submit">Искать</Button>
              {(q ||
                buildingId ||
                minCap !== undefined ||
                maxCap !== undefined) && (
                <Button asChild variant="ghost">
                  <Link href="/rooms">Сброс</Link>
                </Button>
              )}
            </div>
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
                  <TableHead>Здание</TableHead>
                  <TableHead>Комната</TableHead>
                  <TableHead className="w-28 text-right">Вместимость</TableHead>
                  <TableHead>Заметки</TableHead>
                  <TableHead className="w-28 text-right">Опций</TableHead>
                  <TableHead className="w-28 text-right">Занятий</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="text-muted-foreground">
                      {r.building ? (
                        <Link
                          className="hover:underline"
                          href={`/buildings/${r.buildingId}`}
                        >
                          {r.building.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/rooms/${r.id}`} className="hover:underline">
                        {r.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {typeof r.capacity === "number" ? r.capacity : "—"}
                    </TableCell>
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
