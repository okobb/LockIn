import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getContextHistory,
  deleteSession,
  type FocusSessionHistory,
  type GetHistoryParams,
  type ContextHistoryResponse,
} from "../api/contextHistoryApi";

interface UseContextHistoryResult {
  sessions: FocusSessionHistory[];
  stats: ContextHistoryResponse["data"]["stats"];
  isLoading: boolean;
  error: Error | null;
  removeSession: (sessionId: number) => Promise<void>;
}

export function useContextHistoryQuery(
  params?: GetHistoryParams,
): UseContextHistoryResult {
  const queryClient = useQueryClient();

  const queryKey = ["context-history", params];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getContextHistory(params),
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000, 
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: (_, sessionId) => {
      queryClient.setQueryData<ContextHistoryResponse>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            sessions: {
              ...oldData.data.sessions,
              data: oldData.data.sessions.data.filter(
                (s) => s.id !== sessionId,
              ),
            },
            stats: {
              ...oldData.data.stats,
              total_contexts: Math.max(
                0,
                oldData.data.stats.total_contexts - 1,
              ),
            },
          },
        };
      });
    },
  });

  return {
    sessions: data?.data.sessions.data || [],
    stats: data?.data.stats || {
      total_contexts: 0,
      this_week: 0,
      time_saved_minutes: 0,
    },
    isLoading,
    error: error as Error | null,
    removeSession: async (sessionId: number) => {
      await deleteMutation.mutateAsync(sessionId);
    },
  };
}
