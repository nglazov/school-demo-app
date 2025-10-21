// components/schedule/schedule-header.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GroupMultiSelect } from "./group-multi-select";

type Group = { id: number; name: string };

type Props = {
  weekStart: Date;
  groups: Group[];
  selectedGroupIds: number[];
  setSelectedGroupIds: (ids: number[]) => void;

  draftBatchId: number | null;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onStartDraft: () => void;
  onDiscardDraft: () => void;
  onPublishDraft: () => void;

  isPending?: boolean;
};

export function ScheduleHeader({
  weekStart,
  groups,
  selectedGroupIds,
  setSelectedGroupIds,
  draftBatchId,
  onPrevWeek,
  onNextWeek,
  onStartDraft,
  onDiscardDraft,
  onPublishDraft,
  isPending = false,
}: Props) {
  return (
    <Card className="sticky top-0 z-10">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">
          Расписание — неделя {format(weekStart, "d MMM yyyy", { locale: ru })}
        </CardTitle>
        <div className="flex items-center gap-2">
          {draftBatchId ? (
            <Badge>Черновик #{draftBatchId}</Badge>
          ) : (
            <Badge variant="secondary">Просмотр</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          <GroupMultiSelect
            groups={groups}
            value={selectedGroupIds}
            onChange={setSelectedGroupIds}
            placeholder="Выбрать группы"
          />

          <Separator orientation="vertical" className="h-6" />

          <div className="flex gap-2">
            <Button variant="outline" onClick={onPrevWeek}>
              ← Пред. неделя
            </Button>
            <Button variant="outline" onClick={onNextWeek}>
              След. неделя →
            </Button>
          </div>

          <div className="ml-auto flex gap-2">
            {!draftBatchId && (
              <Button
                disabled={selectedGroupIds.length === 0 || isPending}
                onClick={onStartDraft}
              >
                Редактировать расписание
              </Button>
            )}
            {draftBatchId && (
              <>
                <Button
                  variant="destructive"
                  onClick={onDiscardDraft}
                  disabled={isPending}
                >
                  Отменить черновик
                </Button>
                <Button onClick={onPublishDraft} disabled={isPending}>
                  Опубликовать
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
