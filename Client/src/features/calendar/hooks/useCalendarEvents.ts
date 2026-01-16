import { useState, useCallback, useMemo } from "react";
import { useModal } from "../../../shared/context/ModalContext";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type { CalendarBlock, CapacityStats } from "../types/calendar";
import { calendar } from "../api/calendar";
import type {
  CreateBlockData,
  UpdateBlockData,
  CalendarEventsResponse,
  CalendarEvent,
} from "../types/calendar";
import {
  checkBlocksOverlap,
  isOvertime,
  formatDateWithOffset,
  CALENDAR_END_HOUR,
} from "../utils/domain";

export interface PendingMoveState {
  blockId: string;
  blockTitle: string;
  newStart: Date;
  newEnd: Date;
  isOvertime: boolean;
}

interface UseCalendarEventsProps {
  weekStart: Date;
  weekEnd: Date;
}

export function useCalendarEvents({
  weekStart,
  weekEnd,
}: UseCalendarEventsProps) {
  const queryClient = useQueryClient();
  const modal = useModal();
  const [selectedBlockType, setSelectedBlockType] = useState<
    "deep_work" | "meeting" | "external"
  >("deep_work");
  const [selectedDuration, setSelectedDuration] = useState(90);

  const queryKey = [
    "calendar-events",
    weekStart.toISOString(),
    weekEnd.toISOString(),
  ];

  const eventsQuery = useQuery({
    queryKey,
    queryFn: () =>
      calendar.getEvents(weekStart.toISOString(), weekEnd.toISOString()),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData, // Prevents flash during refetch
  });

  const calendarBlocks = useMemo(() => {
    const rawEvents = eventsQuery.data?.data || [];
    return rawEvents.map((event) => ({
      ...event,
      id: String(event.id),
    }));
  }, [eventsQuery.data]);

  const syncMutation = useMutation({
    mutationFn: calendar.syncCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
    onError: async (error) => {
      console.error("Sync failed:", error);
      await modal.open({
        type: "error",
        title: "Sync Failed",
        message:
          "Failed to sync calendar. Please check your connection in Settings.",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: calendar.createBlock,
    onMutate: async (newBlockData: CreateBlockData) => {
      await queryClient.cancelQueries({ queryKey: ["calendar-events"] });

      const previousData =
        queryClient.getQueryData<CalendarEventsResponse>(queryKey);

      queryClient.setQueryData<CalendarEventsResponse>(
        queryKey,
        (old: CalendarEventsResponse | undefined) => {
          if (!old) return old;
          // Use negative ID for temp blocks to match `number` type but distinguish from DB IDs
          const tempId = -Date.now();
          const optimistBlock: CalendarEvent = {
            id: tempId,
            title: newBlockData.title,
            start_time: newBlockData.start_time,
            end_time: newBlockData.end_time,
            type: newBlockData.type,
            description: newBlockData.description || null,
            source: "manual",
            external_id: null,
          };
          return {
            ...old,
            data: [...old.data, optimistBlock],
          };
        }
      );

      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
    onError: async (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      console.error("Create block failed:", error);
      await modal.open({
        type: "error",
        title: "Create Failed",
        message: "Failed to create block. Please try again.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBlockData }) =>
      calendar.updateBlock(id, data),
    onError: async (error) => {
      console.error("Update block failed:", error);
      await modal.open({
        type: "error",
        title: "Update Failed",
        message: "Failed to update block. Changes have been reverted.",
      });
    },
    onSuccess: () => {
      // Refetch to sync with server (keepPreviousData prevents flash)
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
    onSettled: () => {
      // Always invalidate to ensure eventually consistent state
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendar.deleteBlock(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["calendar-events"] });

      const previousData =
        queryClient.getQueryData<CalendarEventsResponse>(queryKey);

      queryClient.setQueryData<CalendarEventsResponse>(
        queryKey,
        (old: CalendarEventsResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter(
              (event: CalendarEvent) => String(event.id) !== id
            ),
          };
        }
      );

      return { previousData };
    },
    onError: async (error, _id, context) => {
      console.error("Delete block failed:", error);
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      await modal.open({
        type: "error",
        title: "Delete Failed",
        message: "Failed to delete block. Changes have been reverted.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });

  const [createBlockState, setCreateBlockState] = useState<{
    isOpen: boolean;
    date: Date | null;
    hour: number | null;
    duration?: number;
  }>({
    isOpen: false,
    date: null,
    hour: null,
    duration: 90,
  });

  const [pendingMoveState, setPendingMoveState] =
    useState<PendingMoveState | null>(null);

  const checkOverlap = useCallback(
    (start: Date, end: Date, excludeBlockId?: string): boolean => {
      return checkBlocksOverlap(start, end, calendarBlocks, excludeBlockId);
    },
    [calendarBlocks]
  );

  const capacityStats = useMemo<CapacityStats>(() => {
    let deepWorkMinutes = 0;
    let meetingMinutes = 0;
    let externalMinutes = 0;

    calendarBlocks.forEach((block) => {
      const start = new Date(block.start_time);
      const end = new Date(block.end_time);
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

      switch (block.type) {
        case "deep_work":
          deepWorkMinutes += durationMinutes;
          break;
        case "meeting":
          meetingMinutes += durationMinutes;
          break;
        case "external":
          externalMinutes += durationMinutes;
          break;
      }
    });

    const totalWorkMinutes = 3000;
    const scheduledMinutes = deepWorkMinutes + meetingMinutes + externalMinutes;
    const availableMinutes = Math.max(0, totalWorkMinutes - scheduledMinutes);

    return {
      deepWorkMinutes,
      meetingMinutes,
      externalMinutes,
      availableMinutes,
      targetMet: deepWorkMinutes >= 600,
    };
  }, [calendarBlocks]);

  const getEventsForDay = useCallback(
    (date: Date): CalendarBlock[] => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      return calendarBlocks.filter((block) => {
        const blockStart = new Date(block.start_time);
        return blockStart >= dayStart && blockStart <= dayEnd;
      });
    },
    [calendarBlocks]
  );

  const addBlock = useCallback(
    (block: CalendarBlock) => {
      const createData: CreateBlockData = {
        title: block.title,
        start_time: block.start_time,
        end_time: block.end_time,
        type: block.type,
      };
      createMutation.mutate(createData);
    },
    [createMutation]
  );

  const updateCalendarBlock = useCallback(
    async (blockId: string, updates: Partial<CalendarBlock>) => {
      const updateData: UpdateBlockData = {
        title: updates.title,
        start_time: updates.start_time,
        end_time: updates.end_time,
        type: updates.type,
      };

      // Cancel in-flight queries before optimistic update
      await queryClient.cancelQueries({ queryKey: ["calendar-events"] });

      // Optimistically update Cache
      queryClient.setQueryData<CalendarEventsResponse>(
        queryKey,
        (old: CalendarEventsResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((event: CalendarEvent) =>
              String(event.id) === blockId
                ? { ...event, ...updates, id: event.id } // Preserve ID
                : event
            ),
          };
        }
      );

      updateMutation.mutate({ id: blockId, data: updateData });
    },
    [updateMutation, queryClient, queryKey]
  );

  const moveBlock = useCallback(
    async (blockId: string, date: Date, hour: number) => {
      const block = calendarBlocks.find((b) => b.id === blockId);
      if (!block) return;

      const currentStart = new Date(block.start_time);
      const currentEnd = new Date(block.end_time);
      const durationMs = currentEnd.getTime() - currentStart.getTime();

      const newStart = new Date(date);
      const absoluteHour = Math.floor(hour);
      const minutes = Math.round((hour - absoluteHour) * 60);
      newStart.setHours(absoluteHour, minutes, 0, 0);

      const newEnd = new Date(newStart.getTime() + durationMs);

      console.log("Moving block:", {
        id: blockId,
        targetDate: date.toDateString(),
        targetHour: hour,
        calculatedStart: newStart.toString(),
        calculatedStartISO: newStart.toISOString(),
      });

      await queryClient.cancelQueries({ queryKey: ["calendar-events"] });

      const previousData =
        queryClient.getQueryData<CalendarEventsResponse>(queryKey);

      queryClient.setQueryData<CalendarEventsResponse>(
        queryKey,
        (old: CalendarEventsResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((event: CalendarEvent) =>
              String(event.id) === blockId
                ? {
                    ...event,
                    start_time: formatDateWithOffset(newStart),
                    end_time: formatDateWithOffset(newEnd),
                  }
                : event
            ),
          };
        }
      );

      if (checkOverlap(newStart, newEnd, blockId)) {
        const confirmed = await modal.open({
          type: "warning",
          title: "Schedule Conflict",
          message: "This time slot overlaps with an existing block.",
        });

        if (!confirmed) {
          // Revert to snapshot - but first cancel any new queries that may have started
          await queryClient.cancelQueries({ queryKey: ["calendar-events"] });
          if (previousData) {
            queryClient.setQueryData(queryKey, previousData);
          }
          return;
        }
      }

      // Check if the block ends after work hours or calendar limit
      const endHour = newEnd.getHours() + newEnd.getMinutes() / 60;

      if (endHour > CALENDAR_END_HOUR) {
        await modal.open({
          type: "error",
          title: "Schedule Conflict",
          message: "Cannot move blocks past 9 PM.",
        });
        // Revert UI by invalidating
        await queryClient.cancelQueries({ queryKey: ["calendar-events"] });
        if (previousData) queryClient.setQueryData(queryKey, previousData);
        return;
      }

      if (isOvertime(endHour)) {
        setPendingMoveState({
          blockId,
          blockTitle: block.title,
          newStart,
          newEnd,
          isOvertime: true,
        });

        return;
      }

      // No overtime - move directly via API
      const payload = {
        start_time: formatDateWithOffset(newStart),
        end_time: formatDateWithOffset(newEnd),
      };

      updateMutation.mutate({
        id: blockId,
        data: payload,
      });
    },
    [
      calendarBlocks,
      checkOverlap,
      updateMutation,
      setPendingMoveState,
      queryClient,
      queryKey,
      modal,
    ]
  );

  const confirmPendingMove = useCallback(() => {
    if (!pendingMoveState) return;

    updateMutation.mutate({
      id: pendingMoveState.blockId,
      data: {
        start_time: formatDateWithOffset(pendingMoveState.newStart),
        end_time: formatDateWithOffset(pendingMoveState.newEnd),
      },
    });

    setPendingMoveState(null);
  }, [pendingMoveState, updateMutation]);

  const cancelPendingMove = useCallback(async () => {
    await queryClient.cancelQueries({ queryKey: ["calendar-events"] });
    queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    setPendingMoveState(null);
  }, [queryClient]);

  const removeBlock = useCallback(
    (blockId: string) => {
      deleteMutation.mutate(blockId);
    },
    [deleteMutation]
  );

  const syncCalendar = useCallback(() => {
    syncMutation.mutate();
  }, [syncMutation]);

  return {
    calendarBlocks,
    capacityStats,
    getEventsForDay,
    addBlock,
    moveBlock,
    confirmPendingMove,
    cancelPendingMove,
    pendingMoveState,
    updateCalendarBlock,
    removeBlock,
    checkOverlap,
    createBlockState,
    setCreateBlockState,
    selectedBlockType,
    setSelectedBlockType,
    selectedDuration,
    setSelectedDuration,
    isLoading: eventsQuery.isLoading,
    isSyncing: syncMutation.isPending,
    syncCalendar,
  };
}
