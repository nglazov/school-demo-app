"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EntityCard } from "./entity-card";

// имитация зарегистрированных сущностей и требуемых ролей
const ENTITIES = [
  { key: "user", title: "Пользователи", path: "/users" },
  { key: "role", title: "Роли", path: "/roles" },
  { key: "lesson", title: "Уроки", path: "/lessons" },
  { key: "room", title: "Комнаты", path: "/rooms" },
  { key: "building", title: "Здания", path: "/buildings" },
  { key: "guardian", title: "Опекуны", path: "/guardians" },
  { key: "student", title: "Ученики", path: "/students" },
  { key: "group", title: "Группы", path: "/groups" },
  { key: "capability", title: "Ограничения", path: "/capabilities" },
  { key: "subject", title: "Предмет", path: "/subjects" },
];

interface Role {
  type: string;
  action: string;
  scope: string;
}

export function EntityDashboard({ roles = [] }: { roles: Role[] }) {
  const [filter, setFilter] = useState("");

  console.log(roles);
  console.log(ENTITIES);

  const available = useMemo(() => {
    return ENTITIES.filter((e) =>
      roles.some(({ type, action }) => type === e.key),
    );
  }, [filter, roles]);

  return (
    <Card className="max-w-3xl mx-auto">
      <CardContent className="p-4 space-y-4">
        <Input
          placeholder="Введите тип сущности..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />

        {available.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Нет доступных сущностей или ничего не найдено.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {available.map((e) => (
            <EntityCard key={e.key} entity={e} roles={roles} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
