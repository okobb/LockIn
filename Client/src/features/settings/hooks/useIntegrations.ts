import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { integrations, type Integration } from "../api/integrations";

export type IntegrationProvider = "google" | "slack" | "github";
export type IntegrationService =
  | "calendar"
  | "gmail"
  | "slack"
  | "notifications"
  | "repos"
  | "workspace"
  | "auth";

export interface IntegrationConfig {
  provider: IntegrationProvider;
  service: IntegrationService;
  name: string;
  icon: string;
  description?: string;
}

export const AVAILABLE_INTEGRATIONS: IntegrationConfig[] = [
  {
    provider: "slack",
    service: "notifications",
    name: "Slack",
    icon: "message-square",
  },
  { provider: "github", service: "repos", name: "GitHub", icon: "github" },
  {
    provider: "google",
    service: "workspace",
    name: "Google Workspace",
    icon: "google",
    description: "Calendar & Gmail",
  },
];

/**
 * Maps service names to scope identifiers that should be present in the integration.
 */
function getRequiredScopeIdentifier(
  service: IntegrationService
): string | null {
  switch (service) {
    case "calendar":
      return "calendar";
    case "gmail":
      return "gmail";
    case "workspace":
      // For workspace, check for either calendar or gmail scope
      return "calendar";
    case "repos":
      return "repo";
    case "slack":
    case "notifications":
      return "chat:write";
    default:
      return null;
  }
}

export interface UseIntegrationsOptions {
  onError?: (message: string) => void;
}

export function useIntegrations(options: UseIntegrationsOptions = {}) {
  const queryClient = useQueryClient();
  const { onError = console.error } = options;

  // Fetch all integrations
  const {
    data: integrationsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => integrations.getAll(),
    retry: 1,
  });

  const userIntegrations = integrationsData?.data ?? [];

  // Check if a specific integration is connected with the required scopes
  const isConnected = (
    provider: string,
    service: IntegrationService
  ): boolean => {
    const integration = userIntegrations.find(
      (i) => i.provider === provider && i.is_active
    );

    if (!integration) {
      return false;
    }

    const requiredScopeId = getRequiredScopeIdentifier(service);
    if (!requiredScopeId) {
      return true;
    }

    return (
      integration.scopes?.some((scope) =>
        scope.toLowerCase().includes(requiredScopeId)
      ) ?? false
    );
  };

  const getIntegration = (provider: string): Integration | undefined => {
    return userIntegrations.find((i) => i.provider === provider && i.is_active);
  };

  const connectMutation = useMutation({
    mutationFn: async ({
      provider,
      service,
    }: {
      provider: string;
      service: string;
    }) => {
      const result = await integrations.getConnectUrl(provider, service);
      window.location.href = result.data.redirect_url;
      return result;
    },
    onError: (error) => {
      console.error("Connect failed:", error);
      onError(
        `Failed to initiate connection: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (integrationId: number) =>
      integrations.disconnect(integrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });

  const connect = (provider: string, service: string) => {
    connectMutation.mutate({ provider, service });
  };

  const disconnect = (integrationId: number) => {
    disconnectMutation.mutate(integrationId);
  };

  return {
    integrations: userIntegrations,
    availableIntegrations: AVAILABLE_INTEGRATIONS,
    isLoading,
    error,
    isConnected,
    getIntegration,
    connect,
    disconnect,
    isConnecting: connectMutation.isPending,
    // We expose the variable of the pending mutation to identify which ID is processing
    disconnectingId: disconnectMutation.isPending
      ? disconnectMutation.variables
      : null,
    // Expose unique key for connecting state
    connectingKey:
      connectMutation.isPending && connectMutation.variables
        ? `${connectMutation.variables.provider}-${connectMutation.variables.service}`
        : null,
  };
}
