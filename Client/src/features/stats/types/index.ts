export interface WeeklyStats {
  flow_time_minutes: number;
  deep_work_blocks: number;
  tasks_completed: number;
  contexts_saved: number;
  flow_time_change_percent: number;
  current_streak_days: number;
  weekly_goal_minutes: number | null;
  goal_progress_percent: number;
}

export interface DailyBreakdown {
  date: string;
  day_name: string;
  flow_time_minutes: number;
  tasks_completed: number;
}

export interface ProductivityInsight {
  type: "trend" | "motivation" | "celebration" | "alert";
  title: string;
  description: string;
  icon: string;
}

export interface SetGoalPayload {
  target_minutes: number;
}
