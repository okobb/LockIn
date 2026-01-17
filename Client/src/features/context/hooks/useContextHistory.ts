import { useState, useEffect, useCallback } from "react";
import {
  getContextHistory,
  type FocusSessionHistory,
  type ContextHistoryStats,
  type GetHistoryParams,
} from "../api/contextHistoryApi";

interface UseContextHistoryResult {
  sessions: FocusSessionHistory[];
  stats: ContextHistoryStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  removeSession: (sessionId: number) => void;
}

export function useContextHistory(
  params?: GetHistoryParams,
): UseContextHistoryResult {
  const [sessions, setSessions] = useState<FocusSessionHistory[]>([]);
  const [stats, setStats] = useState<ContextHistoryStats>({
    total_contexts: 0,
    this_week: 0,
    time_saved_minutes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getContextHistory(params);
      setSessions(response.data.sessions.data);
      setStats(response.data.stats);
    } catch (err) {
      console.error("Failed to fetch context history", err);
      setError("Failed to load context history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [params?.search, params?.status, params?.page]);

  useEffect(() => {
    const timer = setTimeout(fetchHistory, 300);
    return () => clearTimeout(timer);
  }, [fetchHistory]);

  const removeSession = useCallback((sessionId: number) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setStats((prev) => ({
      ...prev,
      total_contexts: Math.max(0, prev.total_contexts - 1),
    }));
  }, []);

  return {
    sessions,
    stats,
    isLoading,
    error,
    refetch: fetchHistory,
    removeSession,
  };
}
