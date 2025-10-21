"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CreateBuildingForm({
  action,
}: {
  action: (fd: FormData) => Promise<void>;
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
          <label htmlFor="name" className="text-sm font-medium">
            Название<span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            name="name"
            placeholder="Напр.: Основное здание"
            required
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <label htmlFor="address" className="text-sm font-medium">
            Адрес
          </label>
          <Textarea
            id="address"
            name="address"
            placeholder="Город, улица, дом…"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Необязательно. Можно оставить пустым.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="mt-2 flex items-center gap-2">
        <Button type="submit">Создать</Button>
        <Button variant="ghost" asChild>
          <Link href="/buildings">Отмена</Link>
        </Button>
      </div>
    </form>
  );
}
