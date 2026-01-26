import { useState, useRef, useEffect } from "react";
import { useLocation, matchPath } from "react-router-dom";
import {
  X,
  Trash2,
  Send,
  Check,
  AlertCircle,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { Button } from "../../../shared/components/UI/Button";
import { Card } from "../../../shared/components/UI/Card";
import { Input } from "../../../shared/components/UI/Input";
import { cn } from "../../../lib/utils";
import { ai, type Source, type ToolCallData } from "../api/ai";
import {
  tasks,
  type CreateTaskData,
  type UpdateTaskData,
} from "../../tasks/api/tasks";
import { useToast } from "../../../shared/context/ToastContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "message" | "tool_call" | "error";
  sources?: Source[];
  tool_call?: ToolCallData & { executed?: boolean };
}

export function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const location = useLocation();
  const [activeContextId, setActiveContextId] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    const match = matchPath("/context-history/:sessionId", location.pathname);

    const searchParams = new URLSearchParams(location.search);
    const queryContextId = searchParams.get("context_id");

    const newContextId = match?.params.sessionId || queryContextId || undefined;
    setActiveContextId(newContextId);
  }, [location]);

  useEffect(() => {
    setMessages([]);

    const fetchHistory = async () => {
      try {
        const { messages: history } = await ai.getThread(activeContextId);
        if (history && history.length > 0) {
          const formatted: Message[] = history.map((msg: any) => ({
            id: msg.id.toString(),
            role: msg.role === "tool" ? "assistant" : msg.role,
            content: msg.content,
            type: msg.tool_calls ? "tool_call" : "message",
            sources: msg.sources,
            tool_call: msg.tool_calls ? msg.tool_calls[0] : undefined,
          }));
          setMessages(formatted);
        } else {
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: activeContextId
                ? "I'm ready to help with this specific context."
                : "Hello! I'm your Lock In Assistant. I can help you manage your tasks and find information.",
            },
          ]);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    };

    if (isOpen) {
      fetchHistory();
    }
  }, [activeContextId, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await ai.chat(userMsg.content, activeContextId);
      const data = response;

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        type: data.type,
        sources: data.sources,
        tool_call: data.tool_call,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          type: "error",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolConfirm = async (
    messageId: string,
    toolCall: { name: string; args: Record<string, unknown> },
  ) => {
    try {
      if (toolCall.name === "create_task") {
        await tasks.create(toolCall.args as unknown as CreateTaskData);
        toast("success", "Task created successfully");
      } else if (toolCall.name === "update_task") {
        await tasks.update(
          toolCall.args.task_id as number,
          toolCall.args.fields as UpdateTaskData,
        );
        toast("success", "Task updated successfully");
      } else if (toolCall.name === "complete_task") {
        await tasks.complete(toolCall.args.task_id as number);
        toast("success", "Task completed successfully");
      }

      // Update message to remove pending state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.tool_call
            ? { ...m, tool_call: { ...m.tool_call, executed: true } }
            : m,
        ),
      );
    } catch {
      toast("error", "Failed to execute action");
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          aria-label="Toggle Global Chat"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-transform duration-300 hover:scale-105",
            isOpen && "rotate-90 scale-0 opacity-0",
            activeContextId ? "bg-blue-600 hover:bg-blue-700" : "bg-primary",
          )}
        >
          {activeContextId ? (
            <FolderOpen className="h-6 w-6 text-white" />
          ) : (
            <img
              src="/Project logo.png"
              alt="Lock In Assistant"
              className="h-10 w-10 object-contain"
            />
          )}
        </Button>
      </div>

      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex w-[400px] flex-col overflow-hidden rounded-lg border bg-background shadow-2xl transition-all duration-300 ease-in-out",
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-10 scale-95 opacity-0 pointer-events-none",
        )}
        style={{ height: "600px" }}
      >
        <Card className="flex h-full flex-col border-0 shadow-none">
          <div
            className={cn(
              "flex items-center justify-between border-b px-4 py-3",
              activeContextId ? "bg-blue-50/50" : "bg-muted/50",
            )}
          >
            <div className="flex items-center gap-2">
              {activeContextId ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                  <FolderOpen className="h-3.5 w-3.5 text-blue-600" />
                </span>
              ) : (
                <img
                  src="/Project logo.png"
                  alt="Logo"
                  className="h-6 w-6 object-contain"
                />
              )}

              <div className="flex flex-col">
                <h3 className="font-semibold text-sm">
                  {activeContextId ? "Context Mode" : "Global Brain"}
                </h3>
                {activeContextId && (
                  <span className="text-[10px] text-muted-foreground">
                    ID: {activeContextId}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleClear}
                title="Clear Chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50"
          >
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-4">
                <img
                  src="/Project logo.png"
                  alt="Logo"
                  className="h-12 w-12 mb-2 opacity-20 object-contain"
                />
                <p className="text-sm">No messages yet.</p>
                <p className="text-xs">
                  Ask me anything about your tasks or schedule!
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full flex-col gap-2",
                  msg.role === "user" ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : msg.type === "error"
                        ? "bg-destructive text-destructive-foreground rounded-tl-none border border-destructive/20"
                        : "bg-muted text-muted-foreground rounded-tl-none",
                  )}
                >
                  <div className="whitespace-pre-wrap">
                    {msg.content ||
                      (msg.type === "tool_call"
                        ? "Execute Action"
                        : "Empty response")}
                  </div>

                  {(() => {
                    let sources = msg.sources;
                    if (typeof sources === "string") {
                      try {
                        sources = JSON.parse(sources);
                      } catch (e) {
                        sources = [];
                      }
                    }

                    if (sources && sources.length > 0) {
                      const validSources = sources.filter((s: any) => s.url);
                      if (validSources.length === 0) return null;

                      return (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {validSources.map((source: any, idx: number) => (
                            <a
                              key={idx}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={source.content?.substring(0, 200)}
                              className="inline-flex items-center rounded-full bg-background/50 px-2 py-0.5 text-[10px] font-medium opacity-80 hover:opacity-100 hover:bg-primary/20 transition-colors cursor-pointer"
                            >
                              🔗 {source.title || `Source ${idx + 1}`}
                            </a>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {msg.type === "tool_call" &&
                  msg.tool_call &&
                  !msg.tool_call.executed && (
                    <Card className="max-w-[85%] border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                          <AlertCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {msg.tool_call.display?.summary ||
                              "Action Required"}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                msg.tool_call &&
                                handleToolConfirm(msg.id, msg.tool_call)
                              }
                            >
                              <Check className="mr-1 h-3 w-3" />
                              {msg.tool_call.display?.confirm_text || "Confirm"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                {msg.type === "tool_call" && msg.tool_call?.executed && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
                    <Check className="h-3 w-3 text-green-500" /> Action
                    completed
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs ml-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-4 bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                autoFocus
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </>
  );
}
