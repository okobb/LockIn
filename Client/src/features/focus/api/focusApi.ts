import api from "../../../shared/lib/axios";

export interface StartSessionParams {
  title: string;
  task_id?: number;
  duration_min?: number;
}

import type { FocusSession } from "../../../shared/types";
export type { FocusSession };

export const startFocusSession = async (
  params: StartSessionParams,
): Promise<FocusSession> => {
  const response = await api.post("/focus-sessions", params);
  return response.data.data.session;
};

export const getSession = async (sessionId: number): Promise<FocusSession> => {
  const response = await api.get(`/focus-sessions/${sessionId}`);
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
  sessionId: number,
): Promise<GitStatusResponse | null> => {
  const response = await api.get(`/focus-sessions/${sessionId}/git-status`);
  return response.data.data;
};

export interface AskAIResponse {
  answer: string;
  sources: Array<{
    score: number;
    content: string;
    resource_id: number;
  }>;
}

export const askAI = async (question: string): Promise<AskAIResponse> => {
  const response = await api.post("/knowledge/ask", { question });
  return response.data;
};

export const toggleChecklistItem = async (sessionId: number, index: number) => {
  const response = await api.patch(
    `/focus-sessions/${sessionId}/checklist/${index}`,
  );
  return response.data;
};

export const addToChecklist = async (sessionId: number, text: string) => {
  const response = await api.post(`/focus-sessions/${sessionId}/checklist`, {
    text,
  });
  return response.data;
};

export const generateAIChecklist = async (sessionId: number) => {
  const response = await api.post(
    `/focus-sessions/${sessionId}/checklist/generate`,
  );
  return response.data;
};
