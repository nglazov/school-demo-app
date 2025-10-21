// components/staff/staff-create-form.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StaffCreateForm({
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
          <label htmlFor="type" className="text-sm font-medium">
            Тип сотрудника<span className="text-destructive">*</span>
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue=""
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Выберите тип…
            </option>
            <option value="TEACHER">Преподаватель</option>
            <option value="ADMIN">Администратор</option>
            <option value="SUPPORT">Сопровождение</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="mt-2 flex items-center gap-2">
        <Button type="submit">Создать</Button>
        <Button variant="ghost" asChild>
          <a href="/staff">Отмена</a>
        </Button>
      </div>
    </form>
  );
}
