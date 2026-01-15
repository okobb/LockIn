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
  // add other fields as needed
}

export const startFocusSession = async (
  params: StartSessionParams
): Promise<FocusSession> => {
  const response = await api.post("/focus-sessions", params);
  // Backend returns { success: true, message: string, data: Session } (if refactored)
  // or { data: Session, status: string ... } (current implementation in controller)
  // The controller refactor in Step 39 returns:
  // { session: ..., status: ..., restored_context: ... } wrapped in createdResponse (data key?)
  // Wait, ApiResponses 'createdResponse' wraps data in 'data' key.
  // So response.data.data will contain { session: ..., status: ... }

  // Actually, let's check the controller store method return again.
  // return $this->createdResponse([ 'session' => $session ... ]);
  // ApiResponses::createdResponse calls successResponse(data, message, 201).
  // successResponse returns { success: true, message: ..., data: data }.
  // So response.data.data will be { session: ..., status: ... }.

  return response.data.data.session;
};
