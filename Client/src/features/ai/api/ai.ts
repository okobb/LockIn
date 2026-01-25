import client from "../../../shared/api/client";

export interface Source {
  resource_id: string;
  score: number;
  content: string;
}

export interface ToolCallData {
  name: string;
  args: Record<string, unknown>;
  display?: {
    summary: string;
    confirm_text: string;
  };
}

export interface AIResponse {
  type: "message" | "tool_call" | "error";
  content: string;
  sources?: Source[];
  tool_call?: ToolCallData;
}

export const ai = {
  chat: async (message: string, activeContextId?: string) => {
    return client.post<AIResponse>("/ai/chat", {
      message,
      active_context_id: activeContextId,
    });
  },
};
