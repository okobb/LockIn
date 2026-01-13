import api from "../../../shared/lib/axios";

export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  type: "deep_work" | "meeting" | "external";
  source: "manual" | "google_calendar";
  external_id: string | null;
}

export interface CreateBlockData {
  title: string;
  start_time: string;
  end_time: string;
  type: "deep_work" | "meeting" | "external";
  description?: string;
}

export interface UpdateBlockData {
  title?: string;
  start_time?: string;
  end_time?: string;
  type?: "deep_work" | "meeting" | "external";
  description?: string;
}

export interface CalendarEventsResponse {
  data: CalendarEvent[];
}

export const calendar = {
  getEvents: async (weekStart: string, weekEnd: string) => {
    const response = await api.get<CalendarEventsResponse>("/calendar/events", {
      params: { start: weekStart, end: weekEnd },
    });
    return response.data;
  },

  getEventsToday: async () => {
    const response = await api.get<CalendarEventsResponse>(
      "/calendar/events/today"
    );
    return response.data;
  },

  syncCalendar: async () => {
    const response = await api.post<{ message: string }>("/calendar/sync");
    return response.data;
  },

  createBlock: async (data: CreateBlockData) => {
    const response = await api.post<{ data: CalendarEvent }>(
      "/calendar/events",
      data
    );
    return response.data;
  },

  updateBlock: async (id: string, data: UpdateBlockData) => {
    const response = await api.patch<{ data: CalendarEvent }>(
      `/calendar/events/${id}`,
      data
    );
    return response.data;
  },

  deleteBlock: async (id: string) => {
    const response = await api.delete<{ message: string }>(
      `/calendar/events/${id}`
    );
    return response.data;
  },
};
