import { useQuery } from "@tanstack/react-query";
import { dashboard, type DashboardStats } from "../api/dashboard";

export const useDashboard = () => {
  const statsQuery = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboard.getStats,
    staleTime: 1000 * 60, // 1 minute
  });

  const priorityTasksQuery = useQuery({
    queryKey: ["dashboard", "priority-tasks"],
    queryFn: dashboard.getPriorityTasks,
    staleTime: 1000 * 60,
  });

  const upcomingQuery = useQuery({
    queryKey: ["dashboard", "upcoming"],
    queryFn: dashboard.getUpcomingEvents,
    staleTime: 1000 * 60,
  });

  const communicationsQuery = useQuery({
    queryKey: ["dashboard", "communications"],
    queryFn: dashboard.getCommunications,
    staleTime: 1000 * 60,
  });

  // Default values for when API fails or hasn't loaded
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
    isLoading:
      statsQuery.isLoading ||
      priorityTasksQuery.isLoading ||
      upcomingQuery.isLoading ||
      communicationsQuery.isLoading,
    isError:
      statsQuery.isError ||
      priorityTasksQuery.isError ||
      upcomingQuery.isError ||
      communicationsQuery.isError,
  };
};
