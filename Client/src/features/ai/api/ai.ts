import client from "../../../shared/api/client";

export interface Source {
  resource_id: string;
  score: number;
  content: string;
  url?: string;
  title?: string;
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
    const response = await client.post<{ data: AIResponse }>("/ai/chat", {
      message,
      active_context_id: activeContextId,
    });
    return response.data;
  },
  getThread: async (activeContextId?: string) => {
    const response = await client.get<{
      data: { thread: any; messages: any[] };
    }>("/ai/thread", {
      params: { context_id: activeContextId },
    });
    return response.data;
  },
};
