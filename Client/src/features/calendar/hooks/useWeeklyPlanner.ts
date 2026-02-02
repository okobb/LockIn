import { useCallback, useEffect, useRef } from "react";
import type { CalendarBlock } from "../types/calendar";
import { useCalendarNavigation } from "./useCalendarNavigation";
import { useCalendarEvents } from "./useCalendarEvents";
import { useCalendarDragDrop } from "./useCalendarDragDrop";
import { useTaskBacklog } from "../../tasks/hooks/useTaskBacklog";
import { useIntegrations } from "../../settings/hooks/useIntegrations";
import { useAuthContext } from "../../auth/context/AuthContext";
import { useModal } from "../../../shared/context/ModalContext";
import {
  WORK_END_HOUR,
  CALENDAR_END_HOUR,
  formatDateWithOffset,
} from "../utils/domain";

export function useWeeklyPlanner() {
  const {
    currentWeekOffset,
    weekStart,
    weekEnd,
    weekLabel,
    weekDays,
    goToNextWeek,
    goToPreviousWeek,
    goToToday,
  } = useCalendarNavigation();

  const modal = useModal();

  const {
    backlogTasks,
    isBacklogCollapsed,
    toggleBacklog,
    updateBacklogTask,
    addBacklogTask,
    removeBacklogTask,
    completeTask,
    scheduleTask,
  } = useTaskBacklog();

  const {
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
    isLoading,
    isSyncing,
    syncCalendar,
  } = useCalendarEvents({ weekStart, weekEnd });

  const { user } = useAuthContext();
  const { isConnected } = useIntegrations();
  const hasSyncedRef = useRef(false);

  // Auto-sync based on preference
  useEffect(() => {
    if (!isConnected("google", "calendar") || hasSyncedRef.current) return;

    const frequency = user?.preferences?.calendar_sync_frequency || "manual";
    if (frequency === "manual") return;

    hasSyncedRef.current = true;
    syncCalendar();
  }, [isConnected, syncCalendar, user]);

  const { handleTaskDrop, returnToBacklog } = useCalendarDragDrop({
    backlogTasks,
    calendarBlocks,
    addBlock,
    removeBlock,
    scheduleTask,
    addBacklogTask,
    checkOverlap,
  });

  const handleAddBlock = useCallback(
    async (date: Date, hour: number) => {
      const startTime = new Date(date);
      const absoluteHour = Math.floor(hour);
      const minutes = Math.round((hour - absoluteHour) * 60);
      startTime.setHours(absoluteHour, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + 90);

      const endHour = endTime.getHours() + endTime.getMinutes() / 60;
      if (absoluteHour >= CALENDAR_END_HOUR || endHour > CALENDAR_END_HOUR) {
        await modal.open({
          type: "error",
          title: "Schedule Conflict",
          message: "Cannot schedule blocks past 9 PM.",
        });
        return;
      }

      if (checkOverlap(startTime, endTime)) {
        await modal.open({
          type: "warning",
          title: "Schedule Conflict",
          message:
            "This time slot already has a block. Please choose another time.",
        });
        return;
      }

      setCreateBlockState({
        isOpen: true,
        date,
        hour,
      });
    },
    [checkOverlap, setCreateBlockState, modal],
  );

  const handleGlobalAddBlock = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();

    // Default logic: Next hour today
    const targetDate = new Date(now);
    let targetHour = currentHour + 1;

    // Fallback: If it's past Work End Hour, default to 9 AM Tomorrow
    if (currentHour >= WORK_END_HOUR) {
      targetDate.setDate(targetDate.getDate() + 1);
      targetHour = 9;
    }

    // Safety check against CALENDAR_END_HOUR
    if (targetHour >= CALENDAR_END_HOUR) {
      targetHour = CALENDAR_END_HOUR - 1; // Default to last available slot
    }

    setCreateBlockState({
      isOpen: true,
      date: targetDate,
      hour: targetHour,
    });
  }, [setCreateBlockState]);

  const confirmCreateBlock = useCallback(
    async (
      title: string,
      type: "deep_work" | "meeting" | "external",
      durationMinutes: number,
      dateOverride?: Date,
      hourOverride?: number,
    ) => {
      const date = dateOverride || createBlockState.date;
      const hour = hourOverride ?? createBlockState.hour;

      if (!date || hour === null) return;

      const startTime = new Date(date);
      const absoluteHour = Math.floor(hour);
      const minutes = Math.round((hour - absoluteHour) * 60);
      startTime.setHours(absoluteHour, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + durationMinutes);

      const endHour = endTime.getHours() + endTime.getMinutes() / 60;
      const isNextDay = endTime.getDate() !== startTime.getDate();

      if (
        absoluteHour >= CALENDAR_END_HOUR ||
        (isNextDay && endHour > 0) ||
        (!isNextDay && endHour > CALENDAR_END_HOUR)
      ) {
        await modal.open({
          type: "error",
          title: "Schedule Conflict",
          message: "Cannot schedule blocks past 9 PM.",
        });
        return;
      }

      if (checkOverlap(startTime, endTime)) {
        await modal.open({
          type: "error",
          title: "Schedule Conflict",
          message: "This time slot overlaps with an existing block.",
        });
        return;
      }

      const newBlock: CalendarBlock = {
        id: `block-${Date.now()}`,
        title,
        start_time: formatDateWithOffset(startTime),
        end_time: formatDateWithOffset(endTime),
        type,
      };

      addBlock(newBlock);
      setCreateBlockState({ isOpen: false, date: null, hour: null });
    },
    [createBlockState, checkOverlap, addBlock, setCreateBlockState, modal],
  );

  const closeCreateBlockModal = useCallback(() => {
    setCreateBlockState({ isOpen: false, date: null, hour: null });
  }, [setCreateBlockState]);

  return {
    weekLabel,
    weekDays,
    weekStart,
    weekEnd,
    currentWeekOffset,

    events: calendarBlocks,
    isLoading,
    isSyncing,
    syncCalendar,
    isFetching: isLoading,
    error: null,
    getEventsForDay,

    capacityStats,

    backlogTasks,
    isBacklogCollapsed,
    toggleBacklog,

    selectedBlockType,
    setSelectedBlockType,
    selectedDuration,
    setSelectedDuration,
    handleTaskDrop,
    handleAddBlock,
    handleGlobalAddBlock,
    moveBlock,
    removeBlock,
    returnToBacklog,
    updateBacklogTask,
    addBacklogTask,
    removeBacklogTask,
    completeTask,
    updateCalendarBlock,

    pendingMoveState,
    confirmPendingMove,
    cancelPendingMove,

    createBlockState,
    setCreateBlockState,
    confirmCreateBlock,
    closeCreateBlockModal,

    goToPreviousWeek,
    goToNextWeek,
    goToToday,
  };
}
