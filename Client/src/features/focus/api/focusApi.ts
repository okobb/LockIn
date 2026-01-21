import client from "../../../shared/api/client";

export interface StartSessionParams {
  title: string;
  task_id?: number;
  duration_min?: number;
}

import type { FocusSession } from "../../../shared/types";
export type { FocusSession };

interface SingleSessionResponse {
  data: {
    session: FocusSession;
  };
}

export const startFocusSession = async (
  params: StartSessionParams,
): Promise<FocusSession> => {
  const data = await client.post<SingleSessionResponse>(
    "/focus-sessions",
    params,
  );
  return data.data.session;
};

export const getSession = async (sessionId: number): Promise<FocusSession> => {
  const data = await client.get<SingleSessionResponse>(
    `/focus-sessions/${sessionId}`,
  );
  return data.data.session;
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
  const data = await client.get<{ data: GitStatusResponse | null }>(
    `/focus-sessions/${sessionId}/git-status`,
  );
  return data.data;
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
  return client.post<AskAIResponse>("/knowledge/ask", { question });
};

export const toggleChecklistItem = async (sessionId: number, index: number) => {
  return client.patch(`/focus-sessions/${sessionId}/checklist/${index}`);
};

export const addToChecklist = async (sessionId: number, text: string) => {
  return client.post(`/focus-sessions/${sessionId}/checklist`, {
    text,
  });
};

export const generateAIChecklist = async (sessionId: number) => {
  return client.post(`/focus-sessions/${sessionId}/checklist/generate`);
};
