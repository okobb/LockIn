import { useQueries } from "@tanstack/react-query";
import { dashboard, type DashboardStats } from "../api/dashboard";

export const useDashboard = () => {
  const results = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "stats"],
        queryFn: dashboard.getStats,
        staleTime: 1000 * 60, // 1 minute
      },
      {
        queryKey: ["dashboard", "priority-tasks"],
        queryFn: dashboard.getPriorityTasks,
        staleTime: 1000 * 60,
      },
      {
        queryKey: ["dashboard", "upcoming"],
        queryFn: dashboard.getUpcomingEvents,
        staleTime: 1000 * 60,
      },
      {
        queryKey: ["dashboard", "communications"],
        queryFn: dashboard.getCommunications,
        staleTime: 1000 * 60,
      },
    ],
  });

  const [statsQuery, priorityTasksQuery, upcomingQuery, communicationsQuery] =
    results;

  const defaultStats: DashboardStats = {
    flowTime: "0h 0m",
    contextsSaved: 0,
    deepWorkBlocks: 0,
    tasksDone: 0,
  };

  return {
    stats: statsQuery.data?.data ?? defaultStats,
    priorityTasks: priorityTasksQuery.data?.data ?? [],
    upcomingEvents: upcomingQuery.data?.data ?? [],
    communications: communicationsQuery.data?.data ?? [],
    isLoading: results.some((result) => result.isLoading),
    isLoadingStats: statsQuery.isLoading,
    isLoadingPriority: priorityTasksQuery.isLoading,
    isLoadingUpcoming: upcomingQuery.isLoading,
    isError: results.some((result) => result.isError),
  };
};
