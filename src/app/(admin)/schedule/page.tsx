// app/(admin)/schedule/page.tsx
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { addDays, startOfWeek } from "date-fns";
import { ScheduleBoard } from "@/components/schedule/schedule-board";
import { ScheduleHeader } from "@/components/schedule/schedule-header";
import {
  fetchEduGroups,
  fetchWeekLessons,
  startDraft,
  discardDraft,
  publishDraft,
} from "./actions";

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [draftBatchId, setDraftBatchId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // загрузка групп
  useEffect(() => {
    startTransition(async () => {
      const data = await fetchEduGroups();
      setGroups(data);
    });
  }, []);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  // универсальная перезагрузка уроков
  const refreshLessons = async (forceDraft?: boolean) => {
    if (selectedGroupIds.length === 0) return;
    const res = await fetchWeekLessons({
      weekStart,
      groupIds: selectedGroupIds,
      includeDraft: forceDraft ?? !!draftBatchId,
    });
    setLessons(res.lessons);
    if (res.draftBatchId) setDraftBatchId(res.draftBatchId);
  };

  // первичная/реактивная загрузка
  useEffect(() => {
    if (selectedGroupIds.length === 0) return;
    startTransition(() => refreshLessons());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, selectedGroupIds, draftBatchId]);

  // недели
  const onPrevWeek = () => setWeekStart((d) => addDays(d, -7));
  const onNextWeek = () => setWeekStart((d) => addDays(d, 7));

  // черновик
  const onStartDraft = () => {
    startTransition(async () => {
      const id = await startDraft({ weekStart, groupIds: selectedGroupIds });
      setDraftBatchId(id);
      await refreshLessons(true); // сразу грузим из драфта
    });
  };

  const onDiscardDraft = () => {
    if (!draftBatchId) return;
    startTransition(async () => {
      await discardDraft({ batchId: draftBatchId });
      setDraftBatchId(null);
      await refreshLessons(false); // опубликованное
    });
  };

  const onPublishDraft = () => {
    if (!draftBatchId) return;
    startTransition(async () => {
      await publishDraft({ batchId: draftBatchId });
      setDraftBatchId(null);
      await refreshLessons(false); // опубликованное
    });
  };

  return (
    <div className="space-y-4 p-4">
      <ScheduleHeader
        weekStart={weekStart}
        groups={groups}
        selectedGroupIds={selectedGroupIds}
        setSelectedGroupIds={setSelectedGroupIds}
        draftBatchId={draftBatchId}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
        onStartDraft={onStartDraft}
        onDiscardDraft={onDiscardDraft}
        onPublishDraft={onPublishDraft}
        isPending={isPending}
      />

      {selectedGroupIds.length > 0 ? (
        <ScheduleBoard
          weekDays={weekDays}
          groups={groups.filter((g) => selectedGroupIds.includes(g.id))}
          lessons={lessons}
          isDraft={!!draftBatchId}
          draftBatchId={draftBatchId} // ⬅ важно: прокидываем
          onRequestRefresh={() =>
            startTransition(async () => {
              await refreshLessons(true); // перезагрузка после создания урока
            })
          }
        />
      ) : (
        <div className="text-muted-foreground p-8 text-center">
          Выберите одну или несколько групп для просмотра расписания
        </div>
      )}
    </div>
  );
}
