import api from "../../../shared/lib/axios";
import type { BrowserTab } from "../types";

export interface ContextSnapshot {
  id: number;
  title: string;
  browser_state: BrowserTab[];
  voice_memo_path?: string;
  voice_transcript?: string;
  voice_duration_sec?: number;
  text_note?: string;
  git_branch?: string;
  git_files_changed?: string[];
  ai_resume_checklist?: Array<{
    text: string;
    source: string;
    is_completed?: boolean;
  }>;
  quality_score?: number;
  created_at: string;
  restored_at?: string;
}

export interface FocusSessionHistory {
  id: number;
  title: string;
  status: "completed" | "abandoned" | "planned";
  started_at: string;
  ended_at?: string;
  actual_duration_min?: number;
  planned_duration_min: number;
  checklist_completed: number;
  checklist_total: number;
  context_snapshot?: ContextSnapshot;
}

export interface ContextHistoryStats {
  total_contexts: number;
  this_week: number;
  time_saved_minutes: number;
}

export interface ContextHistoryResponse {
  success: boolean;
  message: string;
  data: {
    sessions: {
      data: FocusSessionHistory[];
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    stats: ContextHistoryStats;
  };
}

export interface GetHistoryParams {
  search?: string;
  status?: "all" | "completed" | "abandoned";
  page?: number;
}

/**
 * Fetch context history with optional filters
 */
export const getContextHistory = async (
  params?: GetHistoryParams,
): Promise<ContextHistoryResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.search) {
    queryParams.append("search", params.search);
  }
  if (params?.status && params.status !== "all") {
    queryParams.append("status", params.status);
  }
  if (params?.page) {
    queryParams.append("page", String(params.page));
  }

  const queryString = queryParams.toString();
  const url = queryString
    ? `/focus-sessions?${queryString}`
    : "/focus-sessions";

  const response = await api.get<ContextHistoryResponse>(url);
  return response.data;
};

/**
 * Get a single session with its context snapshot
 */
export const getSessionDetail = async (
  sessionId: number,
): Promise<FocusSessionHistory> => {
  const response = await api.get(`/focus-sessions/${sessionId}`);
  return response.data.data.session;
};

/**
 * Mark a session as completed (for abandoned sessions that are actually done)
 */
export const markSessionComplete = async (
  sessionId: number,
): Promise<FocusSessionHistory> => {
  const response = await api.patch(`/focus-sessions/${sessionId}/complete`);
  return response.data.data.session;
};

/**
 * Delete a session and its associated context snapshot
 */
export const deleteSession = async (sessionId: number): Promise<void> => {
  await api.delete(`/focus-sessions/${sessionId}`);
};
