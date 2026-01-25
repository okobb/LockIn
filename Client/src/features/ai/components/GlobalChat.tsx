import { useState, useRef, useEffect } from "react";
import { X, Trash2, Send } from "lucide-react";
import { Button } from "../../../shared/components/UI/Button";
import { Card } from "../../../shared/components/UI/Card";
import { Input } from "../../../shared/components/UI/Input";
import { cn } from "../../../lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your Lock In Assistant. How can I help you stay focused today?",
    },
    {
      id: "2",
      role: "user",
      content: "I need to check my schedule for tomorrow.",
    },
    {
      id: "3",
      role: "assistant",
      content:
        "You have a Focus Session at 9:00 AM and a Team Sync at 2:00 PM.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Simulate AI response for UI testing
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "This is a dummy response. Backend integration coming in Phase 2!",
        },
      ]);
    }, 1000);
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-transform duration-300 hover:scale-105",
            isOpen && "rotate-90 scale-0 opacity-0",
          )}
        >
          <img
            src="/Project logo.png"
            alt="Logo"
            className="h-10 w-10 object-contain"
          />
        </Button>
      </div>

      {/* Main Chat Window */}
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
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/50">
            <div className="flex items-center gap-2">
              <img
                src="/Project logo.png"
                alt="Logo"
                className="h-6 w-6 object-contain"
              />
              <h3 className="font-semibold text-sm">Lock In Assistant</h3>
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

          {/* Message List */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50"
          >
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-4">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-8 w-8 mb-2 opacity-20"
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
                  "flex w-full",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted text-muted-foreground rounded-tl-none",
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
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
              <Button type="submit" size="icon" disabled={!inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </>
  );
}
