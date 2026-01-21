import client from "../../../shared/api/client";

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

import type { User } from "../../../shared/types";
export type { User };

export interface AuthResponse {
  data: {
    user: User;
    authorization: {
      token: string;
      type: string;
      expires_in: number;
    };
  };
  message?: string;
}

export const auth = {
  login: async (credentials: LoginCredentials) => {
    return client.post<AuthResponse>("/login", credentials);
  },

  register: async (data: RegisterData) => {
    return client.post<AuthResponse>("/register", data);
  },

  getGithubRedirect: async () => {
    return client.get<{ data: { redirect_url: string } }>(
      "/auth/github/redirect",
    );
  },

  getGoogleRedirect: async () => {
    return client.get<{ data: { redirect_url: string } }>(
      "/auth/google/redirect",
    );
  },

  getUser: async (id: number) => {
    return client.get<{ data: User }>(`/users/${id}`);
  },

  getMe: async () => {
    return client.get<{ data: User }>("/auth/me");
  },
};
