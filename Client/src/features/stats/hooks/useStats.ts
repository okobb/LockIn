import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  getWeeklyStats,
  getDailyBreakdown,
  getInsights,
} from "../api/statsApi";
import type { WeeklyStats } from "../types";

export const useStats = () => {
  const queryClient = useQueryClient();

  const results = useQueries({
    queries: [
      {
        queryKey: ["stats", "weekly"],
        queryFn: () => getWeeklyStats().then((res) => res.data.data),
        staleTime: 1000 * 60 * 2, // 2 minutes
      },
      {
        queryKey: ["stats", "daily-breakdown"],
        queryFn: () => getDailyBreakdown().then((res) => res.data.data),
        staleTime: 1000 * 60 * 2,
      },
      {
        queryKey: ["stats", "insights"],
        queryFn: () => getInsights().then((res) => res.data.data),
        staleTime: 1000 * 60 * 30, 
      },
    ],
  });

  const [statsQuery, breakdownQuery, insightsQuery] = results;

  const defaultStats: WeeklyStats = {
    flow_time_minutes: 0,
    flow_time_change_percent: 0,
    deep_work_blocks: 0,
    tasks_completed: 0,
    contexts_saved: 0,
    current_streak_days: 0,
    weekly_goal_minutes: 600,
    goal_progress_percent: 0,
  };

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  return {
    stats: statsQuery.data ?? defaultStats,
    breakdown: breakdownQuery.data ?? [],
    insights: insightsQuery.data ?? [],
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    refetch,
  };
};
