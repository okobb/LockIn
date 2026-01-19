export interface User {
  id: number;
  name: string;
  email: string;
  timezone: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: number;
  priority_label: "critical" | "high" | "normal" | "low";
  status: "open" | "in_progress" | "done" | "archived";
  source_type: string | null;
  source_link: string | null;
  ai_reasoning: string | null;
  due_date: string | null;
  estimated_minutes: number | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  progress_percent: number;
  completed_at: string | null;
  created_at: string;
  time_ago: string;
}

export interface FocusSession {
  id: number;
  title: string;
  task_id?: number;
  context_snapshot?: {
    browser_state: Array<{ title: string; url: string }>;
    quality_score?: number;
    ai_resume_checklist?: Array<{
      text: string;
      source: string;
      is_completed?: boolean;
    }>;
    text_note?: string;
  };
}
