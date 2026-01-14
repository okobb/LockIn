import api from "../../../shared/lib/axios";

// Types matching backend TaskResource
export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: number;
  priority_label: "critical" | "high" | "normal" | "low";
  status: "open" | "in_progress" | "done" | "archived";
  source_type: string | null;
  source_link: string | null;
  ai_reasoning: string | null;
  due_date: string | null;
  estimated_minutes: number | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  progress_percent: number;
  completed_at: string | null;
  created_at: string;
  time_ago: string;
}

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
    const response = await api.get<TasksResponse>("/tasks", { params });
    return response.data;
  },

  getBacklog: async () => {
    const response = await api.get<TasksResponse>("/tasks", {
      params: { status: "open", scheduled: "false" },
    });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<{ data: Task }>(`/tasks/${id}`);
    return response.data;
  },

  create: async (data: CreateTaskData) => {
    const response = await api.post<{ data: Task }>("/tasks", data);
    return response.data;
  },

  update: async (id: number, data: UpdateTaskData) => {
    const response = await api.patch<{ data: Task }>(`/tasks/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/tasks/${id}`);
  },

  complete: async (id: number) => {
    return tasks.update(id, { status: "done" });
  },

  schedule: async (
    id: number,
    scheduledStart: string,
    scheduledEnd: string
  ) => {
    return tasks.update(id, {
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
    });
  },
};
