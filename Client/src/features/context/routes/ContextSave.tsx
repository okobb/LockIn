import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  Globe,
  FileCode,
  GitBranch,
  Clock,
  Mic,
  Type,
  Cpu,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { saveContextSnapshot } from "../api/saveContext";
import Sidebar from "../../../shared/components/Sidebar/Sidebar";
import { cn } from "../../../shared/lib/utils";
import { Button } from "../../../shared/components/UI/Button";
import { Card, CardContent } from "../../../shared/components/UI/Card";
import { Input } from "../../../shared/components/UI/Input";
import { Textarea } from "../../../shared/components/UI/Textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../shared/components/UI/Tabs";
import { Badge } from "../../../shared/components/UI/Badge";

type Tab = "voice" | "text" | "auto";

export const ContextSave = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("voice");
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [contextText, setContextText] = useState("");
  const [taskName, setTaskName] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      setIsRecording(true);
      setTimer(0);
      intervalRef.current = window.setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const mockBrowserTabs = Array(8).fill({
        title: "Mock Tab",
        url: "https://example.com",
      });
      const mockGitState = {
        branch: "feature/auth",
        files_changed: ["file1.ts", "file2.ts", "file3.ts"],
        repo: "LockIn",
        diff: "diff...",
      };

      let sessionId = null;
      try {
        const stored = localStorage.getItem("current_focus_session");
        if (stored) {
          sessionId = JSON.parse(stored).sessionId;
        }
      } catch (e) {
        console.error("No session found");
      }

      if (!sessionId) {
        console.warn("No active session ID found. Using mock ID 1 for demo.");
        sessionId = 1;
      }

      await saveContextSnapshot({
        focus_session_id: sessionId,
        note:
          contextText ||
          (activeTab === "voice"
            ? "Voice Note recorded"
            : "Auto-generated context"),
        browser_state: mockBrowserTabs,
        git_state: mockGitState,
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Failed to save context", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main
        className={cn(
          "flex-1 flex flex-col h-screen w-full transition-all duration-300 relative overflow-hidden",
          isSidebarCollapsed ? "pl-[64px]" : "pl-[260px]"
        )}
      >
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl opacity-50" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl opacity-50" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Card className="w-full max-w-2xl bg-card/60 backdrop-blur-xl border-border/50 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary to-transparent opacity-50" />

            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-light tracking-tight flex items-center gap-2">
                    <Save className="w-6 h-6 text-primary" />
                    Lock In Context
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Save your mental state before you step away.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="rounded-full hover:bg-muted"
                >
                  <ArrowLeft className="w-5 h-5 opacity-70" />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-background/50 border border-border/50 flex flex-col gap-1 items-center text-center hover:border-primary/20 transition-colors">
                  <Globe className="w-4 h-4 text-primary mb-1" />
                  <span className="text-sm font-medium">8 Tabs</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Browser
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-background/50 border border-border/50 flex flex-col gap-1 items-center text-center hover:border-primary/20 transition-colors">
                  <FileCode className="w-4 h-4 text-amber-400 mb-1" />
                  <span className="text-sm font-medium">3 Files</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Pending
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-background/50 border border-border/50 flex flex-col gap-1 items-center text-center hover:border-primary/20 transition-colors">
                  <GitBranch className="w-4 h-4 text-purple-400 mb-1" />
                  <span className="text-xs font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">
                    feat/auth
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                    Branch
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-background/50 border border-border/50 flex flex-col gap-1 items-center text-center hover:border-primary/20 transition-colors">
                  <Clock className="w-4 h-4 text-emerald-400 mb-1" />
                  <span className="text-sm font-medium">Now</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Timestamp
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                  Task Definition
                </label>
                <Input
                  placeholder="What are you working on? (Optional)"
                  className="bg-background/50 h-10 border-muted group-hover:border-primary/50 transition-colors"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </div>

              <Tabs
                defaultValue="voice"
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as Tab)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 bg-muted/40 p-1">
                  <TabsTrigger value="voice" className="gap-2">
                    <Mic className="w-4 h-4" /> Voice Note
                  </TabsTrigger>
                  <TabsTrigger value="text" className="gap-2">
                    <Type className="w-4 h-4" /> Text Note
                  </TabsTrigger>
                  <TabsTrigger value="auto" className="gap-2">
                    <Cpu className="w-4 h-4" /> Auto-Generate
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="voice"
                  className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div
                    className={cn(
                      "rounded-xl border-2 border-dashed border-border p-8 flex flex-col items-center justify-center gap-4 transition-all duration-300",
                      isRecording && "border-red-500/50 bg-red-500/5"
                    )}
                  >
                    <div
                      className={cn(
                        "text-4xl font-mono tabular-nums tracking-tighter transition-all",
                        isRecording
                          ? "text-red-500 scale-110"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatTime(timer)}
                    </div>
                    <Button
                      size="lg"
                      className={cn(
                        "rounded-full w-16 h-16 shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center relative",
                        isRecording
                          ? "bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white"
                          : "bg-primary hover:bg-primary/90 shadow-primary/25 text-white"
                      )}
                      onClick={toggleRecording}
                    >
                      {isRecording ? (
                        <div
                          className="w-6 h-6 bg-white rounded-sm shrink-0"
                          style={{ minWidth: "24px", minHeight: "24px" }}
                        />
                      ) : (
                        <Mic
                          className="w-8 h-8 text-white shrink-0"
                          strokeWidth={2.5}
                          style={{ minWidth: "32px", minHeight: "32px" }}
                        />
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground font-medium">
                      {isRecording
                        ? "Recording your thought process..."
                        : "Tap to start recording"}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent
                  value="text"
                  className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <Textarea
                    placeholder="I was in the middle of debugging the token refresh logic. The expiration check seems off..."
                    className="min-h-[200px] resize-none bg-background/50 text-base leading-relaxed p-4"
                    value={contextText}
                    onChange={(e) => setContextText(e.target.value)}
                  />
                </TabsContent>

                <TabsContent
                  value="auto"
                  className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="rounded-xl border border-border/50 bg-background/30 p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Cpu className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="text-lg font-medium">
                      AI Context Generation
                    </h4>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Lock In will analyze your code changes, open tabs, and
                      recent terminal output to generate a summary
                      automatically.
                    </p>
                    <Badge
                      variant="secondary"
                      className="bg-primary/5 text-primary border-primary/20"
                    >
                      Takes ~5-10 seconds
                    </Badge>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="pt-4 flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                {isSuccess ? (
                  <Button
                    className="bg-emerald-500 text-white hover:bg-emerald-600 px-8 disabled:opacity-100"
                    disabled
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Saved
                    Successfully!
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 shadow-lg shadow-primary/20"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving
                        Context...
                      </>
                    ) : (
                      <>
                        {activeTab === "voice" ? (
                          <Mic className="w-4 h-4 mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}{" "}
                        Lock In Context
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
