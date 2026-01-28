import api from "../../../shared/lib/axios";

export interface DashboardStats {
  flowTime: string;
  contextsSaved: number;
  deepWorkBlocks: number;
  tasksDone: number;
}

export interface PriorityTask {
  id: string;
  title: string;
  tag: string;
  tagColor: "red" | "yellow" | "blue" | "green" | "purple";
  reference?: string;
  reason: string;
  dueDate?: string;
  scheduledStart?: string;
  createdAt: string;
}

export interface UpcomingEvent {
  id: string;
  time: string;
  title: string;
  meta: string;
  type: "focus" | "meeting" | "external";
}

export interface Communication {
  id: string;
  source: "slack" | "email" | "pr";
  author: string;
  channel?: string;
  message: string;
  timeAgo: string;
  isUrgent: boolean;
}

export const dashboard = {
  getStats: async (): Promise<{ data: DashboardStats }> => {
    const response = await api.get<{ data: DashboardStats }>(
      "/dashboard/stats"
    );
    return response.data;
  },

  getPriorityTasks: async (): Promise<{ data: PriorityTask[] }> => {
    const response = await api.get<{ data: PriorityTask[] }>(
      "/dashboard/priority-tasks"
    );
    return response.data;
  },

  getUpcomingEvents: async (): Promise<{ data: UpcomingEvent[] }> => {
    const response = await api.get<{ data: UpcomingEvent[] }>(
      "/dashboard/upcoming"
    );
    return response.data;
  },

  getCommunications: async (): Promise<{ data: Communication[] }> => {
    const response = await api.get<{ data: Communication[] }>(
      "/dashboard/communications"
    );
    return response.data;
  },
};
