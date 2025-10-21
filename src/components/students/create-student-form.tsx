// components/students/create-student-form.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CreateStudentForm({
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
          <label htmlFor="lastName" className="text-sm font-medium">
            Фамилия<span className="text-destructive">*</span>
          </label>
          <Input id="lastName" name="lastName" required />
        </div>

        <div className="grid gap-2">
          <label htmlFor="firstName" className="text-sm font-medium">
            Имя<span className="text-destructive">*</span>
          </label>
          <Input id="firstName" name="firstName" required />
        </div>

        <div className="grid gap-2">
          <label htmlFor="middleName" className="text-sm font-medium">
            Отчество
          </label>
          <Input id="middleName" name="middleName" />
        </div>

        <div className="grid gap-2">
          <label htmlFor="birthDate" className="text-sm font-medium">
            Дата рождения
          </label>
          <Input id="birthDate" name="birthDate" type="date" />
        </div>

        <div className="grid gap-2">
          <label htmlFor="phone" className="text-sm font-medium">
            Телефон
          </label>
          <Input id="phone" name="phone" placeholder="+7..." />
        </div>

        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <label htmlFor="externalId" className="text-sm font-medium">
            Внешний ID
          </label>
          <Input
            id="externalId"
            name="externalId"
            placeholder="например, ID из CRM"
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <label htmlFor="notes" className="text-sm font-medium">
            Заметки (не сохраняются)
          </label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Для черновых заметок во время ввода. В БД не пишется."
          />
          <p className="text-xs text-muted-foreground">
            Поле «Заметки» добавлено для удобства и не сохраняется в базу.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="mt-2 flex items-center gap-2">
        <Button type="submit">Создать</Button>
        <Button variant="ghost" asChild>
          <a href="/students">Отмена</a>
        </Button>
      </div>
    </form>
  );
}
