"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchForm({ q }: { q: string }) {
  const [value, setValue] = React.useState(q ?? "");
  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    window.location.search = params.toString();
  };
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        placeholder="Поиск по названию"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit">Искать</Button>
    </form>
  );
}
