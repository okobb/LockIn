import api from "../../../shared/lib/axios";

export interface StartSessionParams {
  title: string;
  task_id?: number;
  duration_min?: number;
}

export interface FocusSession {
  id: number;
  title: string;
  task_id?: number;
  context_snapshot?: {
    browser_state: Array<{ title: string; url: string }>;
  };
}

export const startFocusSession = async (
  params: StartSessionParams
): Promise<FocusSession> => {
  const response = await api.post("/focus-sessions", params);
  return response.data.data.session;
};

export interface GitStatusResponse {
  branch: string;
  files_changed: string[];
  additions: number;
  deletions: number;
  repo: string;
}

export const getGitStatus = async (
  sessionId: number
): Promise<GitStatusResponse | null> => {
  const response = await api.get(`/focus-sessions/${sessionId}/git-status`);
  return response.data.data;
};
