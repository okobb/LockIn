import client from "../../../shared/api/client";

import type { Task } from "../../../shared/types";
export type { Task };

export interface CreateTaskData {
  title: string;
  priority_label?: "critical" | "high" | "normal" | "low";
  estimated_minutes?: number;
  status?: "open" | "in_progress" | "done" | "archived";
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  priority?: number;
  status?: "open" | "in_progress" | "done" | "archived";
  due_date?: string | null;
  estimated_minutes?: number | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
}

export interface TasksResponse {
  data: Task[];
}

export const tasks = {
  getAll: async (params?: {
    status?: string;
    scheduled?: "true" | "false";
  }) => {
    return client.get<TasksResponse>("/tasks", { params });
  },

  getBacklog: async () => {
    return client.get<TasksResponse>("/tasks", {
      params: { status: "open", scheduled: "false" },
    });
  },

  getById: async (id: number) => {
    return client.get<{ data: Task }>(`/tasks/${id}`);
  },

  create: async (data: CreateTaskData) => {
    return client.post<{ data: Task }>("/tasks", data);
  },

  update: async (id: number, data: UpdateTaskData) => {
    return client.patch<{ data: Task }>(`/tasks/${id}`, data);
  },

  delete: async (id: number) => {
    await client.delete(`/tasks/${id}`);
  },

  complete: async (id: number) => {
    return tasks.update(id, { status: "done" });
  },

  schedule: async (
    id: number,
    scheduledStart: string,
    scheduledEnd: string,
  ) => {
    return tasks.update(id, {
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
    });
  },
};
