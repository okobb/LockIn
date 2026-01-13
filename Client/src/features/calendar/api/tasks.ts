import api from "../../../shared/lib/axios";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: number;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  due_date: string | null;
  estimated_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface TasksResponse {
  data: Task[];
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: number;
  due_date?: string;
  estimated_minutes?: number;
}

export const tasks = {
  getAll: async () => {
    const response = await api.get<TasksResponse>("/tasks");
    return response.data;
  },

  getBacklog: async () => {
    // Get unscheduled tasks for the backlog
    const response = await api.get<TasksResponse>("/tasks", {
      params: { status: "pending", unscheduled: true },
    });
    return response.data;
  },

  create: async (data: CreateTaskData) => {
    const response = await api.post<{ data: Task }>("/tasks", data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateTaskData>) => {
    const response = await api.patch<{ data: Task }>(`/tasks/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<{ message: string }>(`/tasks/${id}`);
    return response.data;
  },
};
