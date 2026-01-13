import api from "../../../shared/lib/axios";

export interface Integration {
  id: number;
  provider: string;
  is_active: boolean;
  scopes: string[];
  created_at: string;
  updated_at: string;
}

export interface IntegrationsResponse {
  data: Integration[];
}

export interface ConnectUrlResponse {
  data: {
    redirect_url: string;
  };
}

export const integrations = {
  getAll: async () => {
    const response = await api.get<IntegrationsResponse>("/integrations");
    return response.data;
  },

  getConnectUrl: async (provider: string, service: string) => {
    const response = await api.get<ConnectUrlResponse>(
      `/integrations/connect/${provider}/${service}`
    );
    return response.data;
  },

  disconnect: async (integrationId: number) => {
    const response = await api.delete<{ message: string }>(
      `/integrations/${integrationId}`
    );
    return response.data;
  },
};
