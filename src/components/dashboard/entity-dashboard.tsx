"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EntityCard } from "./entity-card";

// имитация зарегистрированных сущностей и требуемых ролей
const ENTITIES = [
  { name: "User", view: ["admin"], edit: ["admin"] },
  { name: "Role", view: ["admin"], edit: ["admin"] },
  { name: "Lesson", view: ["admin", "teacher"], edit: ["admin"] },
  { name: "Room", view: ["admin", "teacher"], edit: ["admin"] },
  { name: "Guardian", view: ["admin", "teacher"], edit: ["admin"] },
  { name: "Student", view: ["admin", "teacher"], edit: ["admin", "teacher"] },
];

interface Role {
  type: string;
  action: string;
  scope: string;
}

export function EntityDashboard({ roles = [] }: { roles: Role[] }) {
  const [filter, setFilter] = useState("");

  console.log(roles);

  const available = useMemo(() => {
    return ENTITIES.filter((e) =>
      e.view.some((r) =>
        roles.some(({ type, action }) => type === e.name.toLowerCase()),
      ),
    ).filter((e) => e.name.toLowerCase().includes(filter.toLowerCase()));
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
            <EntityCard key={e.name} entity={e} roles={roles} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
