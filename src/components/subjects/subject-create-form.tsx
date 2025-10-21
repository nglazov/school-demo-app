// components/subjects/subject-create-form.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  action: (fd: FormData) => Promise<void>;
};

export function SubjectCreateForm({ action }: Props) {
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
        <div className="grid gap-2 sm:col-span-2">
          <label htmlFor="name" className="text-sm font-medium">
            Название<span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            name="name"
            placeholder="Напр.: Математика"
            required
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <label htmlFor="code" className="text-sm font-medium">
            Код<span className="text-destructive">*</span>
          </label>
          <Input
            id="code"
            name="code"
            placeholder="math"
            required
            pattern="^[a-zA-Z0-9._-]+$"
            title="Допустимы латиница, цифры, точка, дефис и подчеркивание"
          />
          <p className="text-xs text-muted-foreground">
            Код должен быть уникальным и латинским, например <code>math</code>
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="mt-2 flex items-center gap-2">
        <Button type="submit">Создать</Button>
        <Button variant="ghost" asChild>
          <a href="/subjects">Отмена</a>
        </Button>
      </div>
    </form>
  );
}
