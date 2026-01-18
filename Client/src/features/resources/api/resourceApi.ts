import axios from "../../../shared/lib/axios";
import type {
  CreateResourceRequest,
  Resource,
  ResourceFilters,
} from "../types";

export const resourceApi = {
  list: async (
    filters: ResourceFilters = {},
  ): Promise<{ data: Resource[] }> => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.type && filters.type !== "all") {
      if (Array.isArray(filters.type)) {
        filters.type.forEach((t) => params.append("type[]", t));
      } else {
        params.append("type", filters.type);
      }
    }
    if (filters.status && filters.status !== "all")
      params.append("status", filters.status);
    if (filters.difficulty && filters.difficulty !== "all") {
      if (Array.isArray(filters.difficulty)) {
        filters.difficulty.forEach((d) => params.append("difficulty[]", d));
      } else {
        params.append("difficulty", filters.difficulty);
      }
    }

    const response = await axios.get(`/resources?${params.toString()}`);
    return response.data;
  },

  create: async (data: CreateResourceRequest): Promise<Resource> => {
    if (data.file) {
      const formData = new FormData();
      if (data.file) formData.append("file", data.file);
      if (data.title) formData.append("title", data.title);
      if (data.notes) formData.append("notes", data.notes);
      if (data.tags) data.tags.forEach((tag) => formData.append("tags[]", tag));
      if (data.difficulty) formData.append("difficulty", data.difficulty);

      const response = await axios.post("/resources", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    }

    const response = await axios.post("/resources", data);
    return response.data;
  },

  update: async (id: number, data: Partial<Resource>): Promise<Resource> => {
    const response = await axios.put(`/resources/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`/resources/${id}`);
  },

  toggleFavorite: async (id: number): Promise<{ is_favorite: boolean }> => {
    const response = await axios.post(`/resources/${id}/favorite`);
    return response.data;
  },

  markAsRead: async (
    id: number,
    isRead: boolean,
  ): Promise<{ is_read: boolean }> => {
    const response = await axios.post(`/resources/${id}/read`, {
      is_read: isRead,
    });
    return response.data;
  },

  getSuggestions: async (focusSessionId?: number): Promise<Resource[]> => {
    const response = await axios.get("/resources-suggestions", {
      params: { focus_session_id: focusSessionId },
    });
    return response.data;
  },

  addToSession: async (
    sessionId: number,
    title: string,
    url: string,
  ): Promise<void> => {
    await axios.post(`/focus-sessions/${sessionId}/resources`, { title, url });
  },

  getFileUrl: (id: number): string => {
    return `${import.meta.env.VITE_API_URL}/resources/${id}/file`;
  },

  getDownloadUrl: async (id: number): Promise<{ url: string }> => {
    const response = await axios.get(`/resources/${id}/url`);
    return response.data;
  },
};
