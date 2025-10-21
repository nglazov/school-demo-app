// app/buildings/page.tsx
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

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function BuildingsListPage({ searchParams }: PageProps) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");

  // Разрешаем список зданий тем, у кого есть право смотреть комнаты
  await checkPermission(session.sub, "room", "read", "all");

  const q = ((await searchParams)?.q ?? "").trim();

  const items = await prisma.building.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { address: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { rooms: true } },
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Здания</h1>
        <Button asChild>
          <Link href="/buildings/new">Создать здание</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтр</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" action="/buildings" method="get">
            <Input
              name="q"
              placeholder="Поиск по названию или адресу…"
              defaultValue={q}
            />
            <Button type="submit">Искать</Button>
            {q && (
              <Button asChild variant="ghost">
                <Link href="/buildings">Сброс</Link>
              </Button>
            )}
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
                  <TableHead>Название</TableHead>
                  <TableHead>Адрес</TableHead>
                  <TableHead className="text-right">Комнат</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Link
                        href={`/buildings/${b.id}`}
                        className="font-medium hover:underline"
                      >
                        {b.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {b.address ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {b._count.rooms}
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
