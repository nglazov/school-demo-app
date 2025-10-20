"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Entity = {
  name: string;
  view: string[];
  edit: string[];
};

interface Role {
  type: string;
  action: string;
  scope: string;
}

export function EntityCard({
  entity,
  roles,
}: {
  entity: Entity;
  roles: Role[];
}) {
  const canEdit = true;
  const canView = true;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{entity.name}</CardTitle>
        <CardDescription>
          {canEdit
            ? "Можно просматривать и редактировать"
            : canView
              ? "Только просмотр"
              : "Нет доступа"}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex gap-2">
        {canView && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`Открыть ${entity.name}`)}
          >
            Открыть
          </Button>
        )}
        {canEdit && (
          <Button
            size="sm"
            onClick={() => alert(`Редактировать ${entity.name}`)}
          >
            Редактировать
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
