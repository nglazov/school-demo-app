// components/schedule/group-multi-select.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Group = { id: number; name: string };

type Props = {
  groups: Group[];
  value: number[]; // выбранные id
  onChange: (ids: number[]) => void;
  placeholder?: string;
};

export function GroupMultiSelect({
  groups,
  value,
  onChange,
  placeholder = "Выбрать группы",
}: Props) {
  const [open, setOpen] = React.useState(false);

  const picked = React.useMemo(
    () => groups.filter((g) => value.includes(g.id)),
    [groups, value],
  );

  const toggle = (groupId: number) => {
    const exists = value.includes(groupId);
    onChange(exists ? value.filter((x) => x !== groupId) : [...value, groupId]);
  };

  const clear = () => onChange([]);

  return (
    <div className="flex min-w-64 items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-64 justify-between"
          >
            {picked.length ? `${picked.length} групп(ы) выбрано` : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Поиск группы..." />
            <CommandEmpty>Ничего не найдено.</CommandEmpty>
            <CommandGroup>
              {groups.map((g) => {
                const checked = value.includes(g.id);
                return (
                  <CommandItem
                    key={g.id}
                    onSelect={() => toggle(g.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        checked ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {g.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex flex-wrap items-center gap-1">
        {picked.map((g) => (
          <Badge
            key={g.id}
            variant="secondary"
            className="gap-1"
            onClick={() => toggle(g.id)}
          >
            {g.name}
            <X className="h-3 w-3 opacity-60" />
          </Badge>
        ))}
        {picked.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clear}
            className="h-7 px-2"
          >
            Сброс
          </Button>
        )}
      </div>
    </div>
  );
}
