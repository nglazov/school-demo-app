// components/rooms/room-create-form.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type BuildingOption = { id: number; name: string };

type Props = {
  action: (fd: FormData) => Promise<void>;
  buildings: BuildingOption[];
  defaultBuildingId?: number;
};

export function RoomCreateForm({
  action,
  buildings,
  defaultBuildingId,
}: Props) {
  const [error, setError] = React.useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      action={async (fd) => {
        setError(null);
        try {
          await action(fd);
        } catch (e: any) {
          setError(e?.message ?? "Ошибка сохранения");
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="buildingId" className="text-sm font-medium">
            Здание<span className="text-destructive">*</span>
          </label>
          <select
            id="buildingId"
            name="buildingId"
            required
            defaultValue={defaultBuildingId ?? ""}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Выберите здание…
            </option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="name" className="text-sm font-medium">
            Название<span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            name="name"
            placeholder="Напр.: 201, Актовый зал…"
            required
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="capacity" className="text-sm font-medium">
            Вместимость
          </label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={0}
            placeholder="Напр.: 24"
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <label htmlFor="notes" className="text-sm font-medium">
            Заметки
          </label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Примечания: окна на юг, проектор у стены…"
            rows={3}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="mt-2 flex items-center gap-2">
        <Button type="submit">Создать</Button>
        <Button variant="ghost" formAction="/rooms">
          Отмена
        </Button>
      </div>
    </form>
  );
}
