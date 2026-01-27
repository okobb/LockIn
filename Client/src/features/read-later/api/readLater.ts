import axios from "../../../shared/lib/axios";

export interface ReadLaterItem {
  id: number;
  user_id: number;
  resource_id: number;
  estimated_minutes: number | null;
  gap_type: string | null;
  scheduled_for: string | null;
  is_completed: boolean;
  resource: {
    id: number;
    title: string;
    url: string;
    type: string;
    thumbnail_url: string | null;
    estimated_time_minutes: number | null;
  };
}

export interface LiquidSuggestion {
  gap: {
    start: string;
    end: string;
    duration_minutes: number;
    description: string;
  };
  items: ReadLaterItem[];
}

export interface AddReadLaterData {
  resource_id: number;
  gap_type?: string;
  estimated_minutes?: number;
  scheduled_for?: string;
}

export const readLater = {
  getQueue: async (): Promise<ReadLaterItem[]> => {
    const response = await axios.get("/read-later");
    return response.data.data;
  },

  addToQueue: (data: AddReadLaterData): Promise<{ data: ReadLaterItem }> => {
    return axios.post("/read-later", data);
  },

  removeFromQueue: (id: number): Promise<void> => {
    return axios.delete(`/read-later/${id}`);
  },

  startItem: (id: number): Promise<{ data: ReadLaterItem }> => {
    return axios.patch(`/read-later/${id}/start`);
  },

  completeItem: (id: number): Promise<{ data: ReadLaterItem }> => {
    return axios.patch(`/read-later/${id}/complete`);
  },

  getSuggestions: async (): Promise<LiquidSuggestion[]> => {
    const response = await axios.get("/read-later/suggestions");
    return response.data.data;
  },
};
