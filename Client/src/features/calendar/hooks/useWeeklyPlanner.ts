import { useCallback, useEffect, useRef } from "react";
import type { BacklogTask, CalendarBlock } from "../types/calendar";
import { useCalendarNavigation } from "./useCalendarNavigation";
import { useCalendarEvents } from "./useCalendarEvents";
import { useTaskBacklog } from "../../tasks/hooks/useTaskBacklog";
import { useIntegrations } from "../../settings/hooks/useIntegrations";
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

  const {
    backlogTasks,
    isBacklogCollapsed,
    toggleBacklog,
    updateBacklogTask,
    addBacklogTask,
    removeBacklogTask,
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

  const { isConnected } = useIntegrations();
  const hasSyncedRef = useRef(false);

  // Auto-sync on mount if connected (only once)
  useEffect(() => {
    if (isConnected("google", "calendar") && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      syncCalendar();
    }
  }, [isConnected, syncCalendar]);

  const handleTaskDrop = useCallback(
    (taskId: string, date: Date, hour: number) => {
      const task = backlogTasks.find((t) => t.id === taskId);
      if (!task) return;

      const startTime = new Date(date);
      const absoluteHour = Math.floor(hour);
      const minutes = Math.round((hour - absoluteHour) * 60);
      startTime.setHours(absoluteHour, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + task.estimatedMinutes);

      // Check against CALENDAR_END_HOUR
      const endHour = endTime.getHours() + endTime.getMinutes() / 60;
      if (absoluteHour >= CALENDAR_END_HOUR || endHour > CALENDAR_END_HOUR) {
        alert("Cannot schedule tasks past 9 PM.");
        return;
      }

      if (checkOverlap(startTime, endTime)) {
        alert("This time slot overlaps with an existing block.");
        return;
      }

      removeBacklogTask(taskId);

      // Add block to calendar (async with optimistic update)
      const newBlock: CalendarBlock = {
        id: `block-${Date.now()}`,
        title: task.title,
        start_time: formatDateWithOffset(startTime),
        end_time: formatDateWithOffset(endTime),
        type: "deep_work",
      };

      addBlock(newBlock);
    },
    [backlogTasks, checkOverlap, addBlock, removeBacklogTask],
  );

  const returnToBacklog = useCallback(
    (blockId: string) => {
      const block = calendarBlocks.find((b) => b.id === blockId);
      if (!block) return;

      const start = new Date(block.start_time);
      const end = new Date(block.end_time);
      const durationMinutes = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60),
      );

      const newTask: BacklogTask = {
        id: blockId,
        title: block.title,
        priority: "medium",
        estimatedMinutes: durationMinutes,
      };
      addBacklogTask(newTask);
      removeBlock(blockId);
    },
    [calendarBlocks, addBacklogTask, removeBlock],
  );

  const handleAddBlock = useCallback(
    (date: Date, hour: number) => {
      const startTime = new Date(date);
      const absoluteHour = Math.floor(hour);
      const minutes = Math.round((hour - absoluteHour) * 60);
      startTime.setHours(absoluteHour, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + 90);

      const endHour = endTime.getHours() + endTime.getMinutes() / 60;
      if (absoluteHour >= CALENDAR_END_HOUR || endHour > CALENDAR_END_HOUR) {
        alert("Cannot schedule blocks past 9 PM.");
        return;
      }

      if (checkOverlap(startTime, endTime)) {
        alert(
          "This time slot already has a block. Please choose another time.",
        );
        return;
      }

      setCreateBlockState({
        isOpen: true,
        date,
        hour,
      });
    },
    [checkOverlap, setCreateBlockState],
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
    (
      title: string,
      type: "deep_work" | "meeting" | "external",
      durationMinutes: number,
    ) => {
      const { date, hour } = createBlockState;
      if (!date || hour === null) return;

      const startTime = new Date(date);
      const absoluteHour = Math.floor(hour);
      const minutes = Math.round((hour - absoluteHour) * 60);
      startTime.setHours(absoluteHour, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + durationMinutes);

      const endHour = endTime.getHours() + endTime.getMinutes() / 60;
      if (absoluteHour >= CALENDAR_END_HOUR || endHour > CALENDAR_END_HOUR) {
        alert("Cannot schedule blocks past 9 PM.");
        return;
      }

      if (checkOverlap(startTime, endTime)) {
        alert("This time slot overlap with an existing block.");
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
    [createBlockState, checkOverlap, addBlock, setCreateBlockState],
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
