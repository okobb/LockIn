import api from "../../../shared/lib/axios";

export interface UpdateProfileData {
  name?: string;
  email?: string;
  timezone?: string;
  preferences?: {
    calendar_sync_frequency?: "manual" | "daily" | "weekly";
    [key: string]: any;
  };
}

export interface UserResponse {
  data: {
    id: number;
    name: string;
    email: string;
    timezone: string;
    joined_at: string;
    last_updated: string;
  };
  message: string;
}

export const user = {
  updateProfile: async (userId: number, data: UpdateProfileData) => {
    const response = await api.put<UserResponse>(`/users/${userId}`, data);
    return response.data;
  },
};
