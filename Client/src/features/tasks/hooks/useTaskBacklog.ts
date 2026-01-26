import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import { useModal } from "../../../shared/context/ModalContext";
import {
  tasks,
  type Task,
  type CreateTaskData,
  type UpdateTaskData,
  type TasksResponse,
} from "../api/tasks";
import type { BacklogTask } from "../../calendar/types/calendar";

const PRIORITY_TO_LABEL: Record<
  NonNullable<BacklogTask["priority"]>,
  Task["priority_label"]
> = {
  urgent: "critical",
  high: "high",
  medium: "normal",
  low: "low",
};

const LABEL_TO_PRIORITY: Record<
  Task["priority_label"],
  BacklogTask["priority"]
> = {
  critical: "urgent",
  high: "high",
  normal: "medium",
  low: "low",
};

function toBacklogTask(task: Task): BacklogTask {
  return {
    id: String(task.id),
    title: task.title,
    priority: LABEL_TO_PRIORITY[task.priority_label],
    estimatedMinutes: task.estimated_minutes ?? 30,
    tags: task.source_type ? [task.source_type] : [],
  };
}

export function useTaskBacklog() {
  const queryClient = useQueryClient();
  const modal = useModal();
  const [isBacklogCollapsed, setIsBacklogCollapsed] = useState(false);

  const queryKey = ["tasks", "backlog"];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: tasks.getBacklog,
    staleTime: 1000 * 60, // 1 minute
  });

  const createMutation = useMutation({
    mutationFn: tasks.create,
    onMutate: async (newTaskData: CreateTaskData) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const previousData = queryClient.getQueryData<TasksResponse>(queryKey);

      queryClient.setQueryData<TasksResponse>(queryKey, (old) => {
        if (!old) return old;
        const tempId = -Date.now();
        const optimisticTask: Task = {
          id: tempId,
          title: newTaskData.title,
          description: null,
          priority: 50,
          priority_label: newTaskData.priority_label ?? "normal",
          status: newTaskData.status ?? "open",
          source_type: null,
          source_link: null,
          ai_reasoning: null,
          due_date: null,
          estimated_minutes: newTaskData.estimated_minutes ?? 30,
          scheduled_start: null,
          scheduled_end: null,
          progress_percent: 0,
          completed_at: null,
          created_at: new Date().toISOString(),
          time_ago: "just now",
        };
        return { ...old, data: [...old.data, optimisticTask] };
      });

      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: async (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      console.error("Create task failed:", error);
      await modal.open({
        type: "error",
        title: "Create Failed",
        message: "Failed to create task. Please try again.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskData }) =>
      tasks.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: async (error) => {
      console.error("Update task failed:", error);
      await modal.open({
        type: "error",
        title: "Update Failed",
        message: "Failed to update task. Please try again.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tasks.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const previousData = queryClient.getQueryData<TasksResponse>(queryKey);

      queryClient.setQueryData<TasksResponse>(queryKey, (old) => {
        if (!old) return old;
        return { ...old, data: old.data.filter((task) => task.id !== id) };
      });

      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: async (error, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      console.error("Delete task failed:", error);
      await modal.open({
        type: "error",
        title: "Delete Failed",
        message: "Failed to delete task. Please try again.",
      });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: ({
      id,
      start,
      end,
    }: {
      id: number;
      start: string;
      end: string;
    }) => tasks.schedule(id, start, end),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: async (error) => {
      console.error("Schedule task failed:", error);
      await modal.open({
        type: "error",
        title: "Schedule Failed",
        message: "Failed to schedule task. Please try again.",
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => tasks.complete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousData = queryClient.getQueryData<TasksResponse>(queryKey);

      queryClient.setQueryData<TasksResponse>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data
            .map((task) =>
              task.id === id ? { ...task, status: "done" as const } : task,
            )
            .filter((t) => t.status !== "done"),
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: async (error, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      console.error("Complete task failed:", error);
      await modal.open({
        type: "error",
        title: "Complete Failed",
        message: "Failed to complete task. Please try again.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const toggleBacklog = useCallback(() => {
    setIsBacklogCollapsed((prev) => !prev);
  }, []);

  const addBacklogTask = useCallback(
    (task: BacklogTask) => {
      const payload: CreateTaskData = {
        title: task.title,
        estimated_minutes: task.estimatedMinutes,
        priority_label: task.priority
          ? PRIORITY_TO_LABEL[task.priority]
          : "normal",
        status: "open",
      };
      createMutation.mutate(payload);
    },
    [createMutation],
  );

  const updateBacklogTask = useCallback(
    (taskId: string, updates: Partial<BacklogTask>) => {
      const updateData: UpdateTaskData = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.estimatedMinutes)
        updateData.estimated_minutes = updates.estimatedMinutes;

      updateMutation.mutate({ id: Number(taskId), data: updateData });
    },
    [updateMutation],
  );

  const removeBacklogTask = useCallback(
    (taskId: string) => {
      deleteMutation.mutate(Number(taskId));
    },
    [deleteMutation],
  );

  const scheduleTask = useCallback(
    (taskId: string, startTime: string, endTime: string) => {
      scheduleMutation.mutate({
        id: Number(taskId),
        start: startTime,
        end: endTime,
      });
    },
    [scheduleMutation],
  );

  const completeTask = useCallback(
    (taskId: string) => {
      completeMutation.mutate(Number(taskId));
    },
    [completeMutation],
  );

  const backlogTasks = useMemo(
    () => (data?.data ?? []).map(toBacklogTask),
    [data],
  );

  return {
    backlogTasks,
    isBacklogCollapsed,
    isLoading,
    isError,
    toggleBacklog,
    addBacklogTask,
    updateBacklogTask,
    removeBacklogTask,
    completeTask,
    scheduleTask,
  };
}
