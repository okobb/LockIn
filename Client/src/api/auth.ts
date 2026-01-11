import api from "../lib/axios";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  data: {
    user: User;
    token: string;
  };
  message?: string;
}

export const auth = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>("/login", credentials);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post<AuthResponse>("/register", data);
    return response.data;
  },

  getGithubRedirect: async () => {
    const response = await api.get<{ data: { redirect_url: string } }>(
      "/auth/github/redirect"
    );
    return response.data;
  },

  getGoogleRedirect: async () => {
    const response = await api.get<{ data: { redirect_url: string } }>(
      "/auth/google/redirect"
    );
    return response.data;
  },
};
