import { useState, useCallback } from "react";
import type { BacklogTask } from "../types/calendar";


export function useTaskBacklog() {
  const [isBacklogCollapsed, setIsBacklogCollapsed] = useState(false);

  const [backlogTasks, setBacklogTasks] = useState<BacklogTask[]>([]);

  const toggleBacklog = useCallback(() => {
    setIsBacklogCollapsed((prev) => !prev);
  }, []);

  const updateBacklogTask = useCallback(
    (taskId: string, updates: Partial<BacklogTask>) => {
      setBacklogTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      );
    },
    []
  );

  const addBacklogTask = useCallback((task: BacklogTask) => {
    setBacklogTasks((prev) => [...prev, task]);
  }, []);

  const removeBacklogTask = useCallback((taskId: string) => {
    setBacklogTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  return {
    backlogTasks,
    isBacklogCollapsed,
    toggleBacklog,
    updateBacklogTask,
    addBacklogTask,
    removeBacklogTask,
  };
}
