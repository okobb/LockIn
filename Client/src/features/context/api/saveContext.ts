import api from "../../../shared/lib/axios";
import type { SaveContextRequest, SaveContextResponse } from "../types/index";

export const saveContextSnapshot = async (
  request: SaveContextRequest
): Promise<SaveContextResponse> => {
  const formData = new FormData();
  formData.append("focus_session_id", String(request.focus_session_id));

  if (request.note) {
    formData.append("note", request.note);
  }

  if (request.browser_state) {
    formData.append("browser_state", JSON.stringify(request.browser_state));
  }

  if (request.git_state) {
    formData.append("git_state", JSON.stringify(request.git_state));
  }

  if (request.voice_file) {
    formData.append("voice_file", request.voice_file);
  }

  if (request.checklist && request.checklist.length > 0) {
    request.checklist.forEach((item, index) => {
      formData.append(`checklist[${index}]`, item);
    });
  }

  const response = await api.post<SaveContextResponse>(
    "/context/save",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
