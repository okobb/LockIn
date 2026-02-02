import { useCallback, useRef } from "react";
import { useModal } from "../../../shared/context/ModalContext";
import type { BacklogTask, CalendarBlock } from "../types/calendar";
import { CALENDAR_END_HOUR, formatDateWithOffset } from "../utils/domain";

interface UseCalendarDragDropProps {
  backlogTasks: BacklogTask[];
  calendarBlocks: CalendarBlock[];
  addBlock: (block: CalendarBlock) => void;
  removeBlock: (id: string) => void;
  scheduleTask: (id: string, start: string, end: string) => void;
  addBacklogTask: (task: BacklogTask) => void;
  checkOverlap: (start: Date, end: Date, excludeId?: string) => boolean;
}

export function useCalendarDragDrop({
  backlogTasks,
  calendarBlocks,
  addBlock,
  removeBlock,
  scheduleTask,
  addBacklogTask,
  checkOverlap,
}: UseCalendarDragDropProps) {
  const modal = useModal();
  const processingTasks = useRef<Set<string>>(new Set());

  const handleTaskDrop = useCallback(
    async (taskId: string, date: Date, hour: number) => {
      if (processingTasks.current.has(taskId)) {
        console.warn("Drop ignored - task already processing:", taskId);
        return;
      }

      const task = backlogTasks.find((t) => t.id === taskId);
      if (!task) return;

      processingTasks.current.add(taskId);
      setTimeout(() => {
        processingTasks.current.delete(taskId);
      }, 2000);

      const startTime = new Date(date);
      const absoluteHour = Math.floor(hour);
      const minutes = Math.round((hour - absoluteHour) * 60);
      startTime.setHours(absoluteHour, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + task.estimatedMinutes);

      const endHour = endTime.getHours() + endTime.getMinutes() / 60;
      const isNextDay = endTime.getDate() !== startTime.getDate();

      if (
        absoluteHour >= CALENDAR_END_HOUR ||
        (isNextDay && endHour > 0) ||
        (!isNextDay && endHour > CALENDAR_END_HOUR)
      ) {
        processingTasks.current.delete(taskId);
        await modal.open({
          type: "error",
          title: "Schedule Conflict",
          message: "Cannot schedule tasks past 9 PM.",
        });
        return;
      }

      if (checkOverlap(startTime, endTime)) {
        processingTasks.current.delete(taskId);
        await modal.open({
          type: "error",
          title: "Schedule Conflict",
          message: "This time slot overlaps with an existing block.",
        });
        return;
      }

      try {
        scheduleTask(taskId, startTime.toISOString(), endTime.toISOString());

        const newBlock: CalendarBlock = {
          id: `block-${Date.now()}`,
          title: task.title,
          start_time: formatDateWithOffset(startTime),
          end_time: formatDateWithOffset(endTime),
          type: "deep_work",
          priority: task.priority,
          tags: task.tags,
          task_id: Number(taskId),
        };

        addBlock(newBlock);
      } catch (error) {
        console.error("Drop failed:", error);
        processingTasks.current.delete(taskId);
      }
    },
    [backlogTasks, checkOverlap, addBlock, scheduleTask, modal],
  );

  const returnToBacklog = useCallback(
    (blockId: string, fallbackTitle?: string) => {
      console.log("Returning to backlog:", blockId, fallbackTitle);

      let block = calendarBlocks.find((b) => b.id === blockId);

      if (!block && fallbackTitle) {
        block = calendarBlocks.find((b) => b.title === fallbackTitle);
        console.log("Block ID not found, matched by title:", block?.id);
      }

      if (!block) {
        console.error("Cannot return to backlog: block not found", {
          blockId,
          fallbackTitle,
        });
        return;
      }

      const start = new Date(block.start_time);
      const end = new Date(block.end_time);
      const durationMinutes = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60),
      );

      const newTask: BacklogTask = {
        id: block.id,
        title: block.title,
        priority: block.priority || "medium",
        estimatedMinutes: durationMinutes,
        tags: block.tags,
      };

      try {
        addBacklogTask(newTask);
        removeBlock(block.id);
      } catch (e) {
        console.error("Return to backlog failed:", e);
      }
    },
    [calendarBlocks, addBacklogTask, removeBlock],
  );

  return {
    handleTaskDrop,
    returnToBacklog,
  };
}
