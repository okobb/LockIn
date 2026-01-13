import { useCallback } from "react";
import type { BacklogTask, CalendarBlock } from "../types/calendar";
import { useCalendarNavigation } from "./useCalendarNavigation";
import { useCalendarEvents } from "./useCalendarEvents";
import { useTaskBacklog } from "./useTaskBacklog";
import { WORK_END_HOUR, formatDateWithOffset } from "../utils/domain";

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

      if (checkOverlap(startTime, endTime)) {
        alert("This time slot overlaps with an existing block.");
        return;
      }

      // ATOMIC OPERATION: Remove from backlog first (synchronous),
      // then add to calendar. This ensures no duplication.
      // If calendar add fails, user sees error but task is removed from backlog
      // (acceptable UX - they can re-add the task)
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
    [backlogTasks, checkOverlap, addBlock, removeBacklogTask]
  );

  const returnToBacklog = useCallback(
    (blockId: string) => {
      const block = calendarBlocks.find((b) => b.id === blockId);
      if (!block) return;

      const start = new Date(block.start_time);
      const end = new Date(block.end_time);
      const durationMinutes = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60)
      );

      const newTask: BacklogTask = {
        id: blockId,
        title: block.title,
        priority: "medium",
        estimatedMinutes: durationMinutes,
      };

      // ATOMIC OPERATION: Add to backlog first (synchronous),
      // then remove from calendar. This ensures no item is lost.
      // If calendar delete fails, item exists in both places temporarily
      // (acceptable UX - user can manually delete from calendar)
      addBacklogTask(newTask);
      removeBlock(blockId);
    },
    [calendarBlocks, addBacklogTask, removeBlock]
  );

  const handleAddBlock = useCallback(
    (date: Date, hour: number) => {
      const startTime = new Date(date);
      const absoluteHour = Math.floor(hour);
      const minutes = Math.round((hour - absoluteHour) * 60);
      startTime.setHours(absoluteHour, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + 90);

      if (checkOverlap(startTime, endTime)) {
        alert(
          "This time slot already has a block. Please choose another time."
        );
        return;
      }

      setCreateBlockState({
        isOpen: true,
        date,
        hour,
      });
    },
    [checkOverlap, setCreateBlockState]
  );

  const handleGlobalAddBlock = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();

    // Default logic: Next hour today
    let targetDate = new Date(now);
    let targetHour = currentHour + 1;

    // Fallback: If it's past Work End Hour, default to 9 AM Tomorrow
    if (currentHour >= WORK_END_HOUR) {
      targetDate.setDate(targetDate.getDate() + 1);
      targetHour = 9;
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
      durationMinutes: number
    ) => {
      const { date, hour } = createBlockState;
      if (!date || hour === null) return;

      const startTime = new Date(date);
      const absoluteHour = Math.floor(hour);
      const minutes = Math.round((hour - absoluteHour) * 60);
      startTime.setHours(absoluteHour, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + durationMinutes);

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
    [createBlockState, checkOverlap, addBlock, setCreateBlockState]
  );

  const closeCreateBlockModal = useCallback(() => {
    setCreateBlockState({ isOpen: false, date: null, hour: null });
  }, [setCreateBlockState]);

  return {
    // Week state
    weekLabel,
    weekDays,
    weekStart,
    weekEnd,
    currentWeekOffset,

    // Events
    events: calendarBlocks,
    isLoading,
    isSyncing,
    syncCalendar,
    isFetching: isLoading,
    error: null,
    getEventsForDay,

    // Capacity
    capacityStats,

    // Backlog
    backlogTasks,
    isBacklogCollapsed,
    toggleBacklog,

    // Actions
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

    // Pending move (overtime confirmation)
    pendingMoveState,
    confirmPendingMove,
    cancelPendingMove,

    // Modal state
    createBlockState,
    setCreateBlockState,
    confirmCreateBlock,
    closeCreateBlockModal,

    // Navigation
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
  };
}
