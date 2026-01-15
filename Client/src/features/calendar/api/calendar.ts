import api from "../../../shared/lib/axios";
import type { CalendarEvent, CalendarEventsResponse, CreateBlockData, UpdateBlockData } from "../types/calendar";

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
