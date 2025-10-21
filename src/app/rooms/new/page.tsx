// app/rooms/new/page.tsx
import "server-only";
import * as React from "react";
import Link from "next/link";
import { getSessionCasted } from "@/lib/session";
import { checkPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomCreateForm } from "@/components/rooms/room-create-form";
import { createRoomAction } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ buildingId?: string }>;
};

export default async function RoomsCreatePage({ searchParams }: PageProps) {
  const session = await getSessionCasted();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  // сейчас проверяем право чтения комнат (как и на других страницах).
  // когда добавишь room:write:all — поменяй на write.
  await checkPermission(session.sub, "room", "read", "all");

  const sp = await searchParams;
  const prefillBuildingId = sp.buildingId ? Number(sp.buildingId) : undefined;

  const buildings = await prisma.building.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Создать комнату</h1>
        <Button asChild variant="outline">
          <Link href="/rooms">К списку</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новая комната</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomCreateForm
            action={createRoomAction}
            buildings={buildings}
            defaultBuildingId={prefillBuildingId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
