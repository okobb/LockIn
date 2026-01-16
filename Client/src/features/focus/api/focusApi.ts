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
}

export const startFocusSession = async (
  params: StartSessionParams
): Promise<FocusSession> => {
  const response = await api.post("/focus-sessions", params);
  return response.data.data.session;
};
