"use client";

import { CapabilityValueType } from "@prisma/client";
import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// вынесено в отдельный клиентский компонент
export function CreateCapabilityForm({
  action,
}: {
  action: (fd: FormData) => Promise<void>;
}) {
  // легковесная форма без react-hook-form, чтобы не тянуть клиентские зависимости
  const [error, setError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        setError(null);
        try {
          await action(fd);
        } catch (e: any) {
          setError(e?.message ?? "Ошибка сохранения");
        }
      }}
      className="space-y-4"
    >
      <div className={formGrid()}>
        <div className={fieldClasses()}>
          <label htmlFor="name" className={labelClasses()}>
            Название
          </label>
          <input
            id="name"
            name="name"
            className={inputBaseClass()}
            placeholder="Напр.: Проектор"
            required
          />
        </div>

        <div className={fieldClasses()}>
          <label htmlFor="key" className={labelClasses()}>
            Ключ
          </label>
          <input
            id="key"
            name="key"
            className={inputBaseClass()}
            placeholder="projector"
            pattern="^[a-z0-9._-]+$"
            title="Допустимы: a-z, 0-9, точка, дефис и подчеркивание"
            required
          />
          <p className={helpText()}>уникальный, латиницей (a–z, 0–9, . _ -)</p>
        </div>

        <div className={fieldClasses()}>
          <label htmlFor="valueType" className={labelClasses()}>
            Тип значения
          </label>
          <select
            id="valueType"
            name="valueType"
            className={selectBaseClass()}
            required
          >
            {Object.values(CapabilityValueType).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <p className={helpText()}>
            BOOL, ENUM, INT или TEXT — влияет на хранение и валидацию значений
          </p>
        </div>
      </div>

      {error && <p className={errorClasses()}>{error}</p>}

      <div className={actionsRow()}>
        <Button type="submit">Создать</Button>
        <Button variant="ghost" asChild>
          <Link href="/capabilities">Отмена</Link>
        </Button>
      </div>
    </form>
  );
}

function fieldClasses() {
  return "grid gap-2";
}

function labelClasses() {
  return "text-sm font-medium";
}

function errorClasses() {
  return "text-sm text-destructive";
}

function selectBaseClass() {
  return "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
}

function inputBaseClass() {
  return "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
}

function formGrid() {
  return "grid gap-4 sm:grid-cols-2";
}

function actionsRow() {
  return "mt-4 flex items-center gap-2";
}

function helpText() {
  return "text-xs text-muted-foreground";
}
