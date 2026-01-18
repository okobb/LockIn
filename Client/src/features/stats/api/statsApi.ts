import apiClient from "../../../shared/lib/axios";
import type {
  WeeklyStats,
  DailyBreakdown,
  ProductivityInsight,
  SetGoalPayload,
} from "../types";

export const getWeeklyStats = () => {
  return apiClient.get<{ data: WeeklyStats }>("/stats/weekly");
};

export const getDailyBreakdown = () => {
  return apiClient.get<{ data: DailyBreakdown[] }>("/stats/daily-breakdown");
};

export const setWeeklyGoal = (payload: SetGoalPayload) => {
  return apiClient.post("/stats/goal", payload);
};

export const getInsights = () => {
  return apiClient.get<{ data: ProductivityInsight[] }>("/stats/insights");
};
