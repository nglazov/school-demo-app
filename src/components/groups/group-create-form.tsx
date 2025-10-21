// components/groups/group-create-form.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Year = {
  id: number;
  code: string;
  startsOn: string | Date;
  endsOn: string | Date;
};

export function GroupCreateForm({
  action,
  years,
}: {
  action: (fd: FormData) => Promise<void>;
  years: Year[];
}) {
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
          <label htmlFor="academicYearId" className="text-sm font-medium">
            Учебный год<span className="text-destructive">*</span>
          </label>
          <select
            id="academicYearId"
            name="academicYearId"
            required
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Выберите год…
            </option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.code}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="name" className="text-sm font-medium">
            Название<span className="text-destructive">*</span>
          </label>
          <Input id="name" name="name" placeholder="Напр.: 7А" required />
        </div>

        <div className="grid gap-2">
          <label htmlFor="key" className="text-sm font-medium">
            Ключ<span className="text-destructive">*</span>
          </label>
          <Input
            id="key"
            name="key"
            placeholder="7a-2025"
            required
            pattern="^[a-zA-Z0-9._-]+$"
            title="Допустимы латиница, цифры, точка, дефис и подчеркивание"
          />
          <p className="text-xs text-muted-foreground">
            Должен быть уникален (используется в интеграциях).
          </p>
        </div>

        <div className="grid gap-2">
          <label htmlFor="gradeLevel" className="text-sm font-medium">
            Класс (уровень)
          </label>
          <Input
            id="gradeLevel"
            name="gradeLevel"
            type="number"
            min={1}
            placeholder="напр.: 7"
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <label htmlFor="track" className="text-sm font-medium">
            Трек
          </label>
          <Input id="track" name="track" placeholder="напр.: A" />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="mt-2 flex items-center gap-2">
        <Button type="submit">Создать</Button>
        <Button variant="ghost" asChild>
          <a href="/groups">Отмена</a>
        </Button>
      </div>
    </form>
  );
}
