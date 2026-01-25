import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  LayoutDashboard,
  Pause,
  Plus,
  Bell,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  FileText,
  Play,
  ArrowRight,
  Monitor,
  Terminal,
  Sparkles,
  Loader2,
  Bot,
  Check,
} from "lucide-react";
import { useModal } from "../../../shared/context/ModalContext";
import { useFocusSession } from "../hooks/useFocusSession";
import {
  getGitStatus,
  type GitStatusResponse,
  askAI,
  addToChecklist,
  generateAIChecklist,
  toggleChecklistItem,
} from "../api/focusApi";
import { markSessionComplete } from "../../context/api/contextHistoryApi";

import { cn } from "../../../shared/lib/utils";
import { Button } from "../../../shared/components/UI/Button";
import { Card } from "../../../shared/components/UI/Card";
import { Badge } from "../../../shared/components/UI/Badge";
import { Textarea } from "../../../shared/components/UI/Textarea";
import { Input } from "../../../shared/components/UI/Input";
import { QualityScoreBadge } from "../../../shared/components/QualityScoreBadge/QualityScoreBadge";
import { useSessionContext } from "../context/SessionContext";
import { EndSessionModal } from "../components/EndSessionModal";
import { tasks } from "../../tasks/api/tasks";

interface FocusState {
  taskId?: number;
  title: string;
  isFreestyle?: boolean;
  sessionId?: number;
  isNewSession?: boolean;
  timer?: number;
  isPaused?: boolean;
}

// ... (in component)
export default function FocusMode() {
  const location = useLocation();
  const navigate = useNavigate();
  const { open } = useModal();
  const { activeSession, updateSession, clearSession } = useSessionContext();

  // Force HMR update
  const locationState = location.state as FocusState | null;
  const activeState = locationState || activeSession;

  const { session, setSession } = useFocusSession(activeState);

  const [isContextCollapsed, setIsContextCollapsed] = useState(false);
  const [isEndSessionModalOpen, setIsEndSessionModalOpen] = useState(false);

  // Track which session we've initialized for to detect navigation changes
  const lastInitializedSession = useRef<string | null>(null);

  const getSessionKey = (state: FocusState | null): string | null => {
    if (!state) return null;
    if (state.sessionId) return `session:${state.sessionId}`;
    if (state.taskId) return `task:${state.taskId}`;
    return `title:${state.title}`;
  };

  // Initialize timer from context if available (for page reload)
  const [timer, setTimer] = useState(() => {
    if (locationState?.timer !== undefined) return locationState.timer;

    if (typeof window === "undefined") return 25 * 60;
    const stored = localStorage.getItem("current_focus_session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Verify this is for the same session/task
        const sameSession =
          locationState?.sessionId &&
          parsed.sessionId === locationState.sessionId;
        const sameTask =
          locationState?.taskId && parsed.taskId === locationState.taskId;
        const sameTitle =
          locationState?.title && parsed.title === locationState.title;

        if (sameSession || sameTask || sameTitle) {
          return parsed.timer ?? 25 * 60;
        }
      } catch {
        return 25 * 60;
      }
    }
    return 25 * 60;
  });
  const [isPaused, setIsPaused] = useState(() => {
    if (locationState?.isPaused !== undefined) return locationState.isPaused;

    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("current_focus_session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const sameSession =
          locationState?.sessionId &&
          parsed.sessionId === locationState.sessionId;
        const sameTask =
          locationState?.taskId && parsed.taskId === locationState.taskId;
        const sameTitle =
          locationState?.title && parsed.title === locationState.title;

        if (sameSession || sameTask || sameTitle) {
          return parsed.isPaused ?? false;
        }
      } catch {
        return false;
      }
    }
    return false;
  });

  const [note, setNote] = useState("");

  const [isDarkTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      return saved ? saved === "dark" : true;
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkTheme) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }, [isDarkTheme]);

  // AI State
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<{
    text: string;
    sources: any[];
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isNoteHydrated, setIsNoteHydrated] = useState(false);

  useEffect(() => {
    const currentSessionKey = getSessionKey(locationState);

    if (activeState) {
      if ((activeState as FocusState).isNewSession) {
        console.log(
          "New session flag detected - Resetting timer for fresh start",
        );
        clearSession();
        setTimer(25 * 60);
        setIsPaused(false);
        lastInitializedSession.current = currentSessionKey;
        setIsInitialized(true);

        // Consume the flag so it doesn't trigger on reload
        const newState = { ...activeState };
        delete (newState as any).isNewSession;
        navigate(location.pathname, { replace: true, state: newState });
        return;
      }

      if (locationState && activeSession) {
        const sameSessionId =
          activeState.sessionId &&
          activeSession.sessionId &&
          Number(activeState.sessionId) === Number(activeSession.sessionId);

        const sameTaskId =
          activeState.taskId &&
          activeSession.taskId &&
          Number(activeState.taskId) === Number(activeSession.taskId);

        const sameFreestyle = activeState.title === activeSession.title;

        if (!(sameSessionId || sameTaskId || sameFreestyle)) {
          // Mismatch - navigating to a different task
          console.log("Session mismatch - Resetting timer for new task");
          clearSession();
          setTimer(25 * 60);
          setIsPaused(false);
        }
      }

      lastInitializedSession.current = currentSessionKey;
    }

    setIsInitialized(true);
  }, [locationState]);

  // Timer logic
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setTimer((prev: number) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Persistence logic for Timer & Pause state
  useEffect(() => {
    if (!activeState || !isInitialized) return;

    // Check if we need to update context
    if (activeSession) {
      if (
        activeSession.timer !== timer ||
        activeSession.isPaused !== isPaused
      ) {
        updateSession({
          ...activeSession,
          timer,
          isPaused,
          lastUpdated: Date.now(),
        });
      }
    } else if (session?.id && activeState) {
      updateSession({
        sessionId: session.id,
        taskId: activeState.taskId,
        title: activeState.title,
        isFreestyle: activeState.isFreestyle,
        timer,
        isPaused,
        lastUpdated: Date.now(),
      });
    }
  }, [timer, isPaused, activeState, isInitialized, activeSession, session?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePause = () => setIsPaused(!isPaused);

  const [restoredTabs, setRestoredTabs] = useState<
    Array<{ title: string; url: string }>
  >([]);

  useEffect(() => {
    if (session?.context_snapshot?.browser_state) {
      setRestoredTabs(session.context_snapshot.browser_state);
    }
  }, [session]);

  const [activeGitState, setActiveGitState] =
    useState<GitStatusResponse | null>(null);

  useEffect(() => {
    const fetchGitData = async () => {
      if (session?.id) {
        try {
          const data = await getGitStatus(session.id);
          setActiveGitState(data);
        } catch (error) {
          console.error("Failed to fetch git status", error);
        }
      } else if (activeState?.sessionId) {
        // Fallback if session object isn't fully loaded yet but we have ID
        try {
          const data = await getGitStatus(activeState.sessionId);
          setActiveGitState(data);
        } catch (error) {
          console.error("Failed to fetch git status", error);
        }
      }
    };
    fetchGitData();
  }, [session?.id, activeState?.sessionId]);

  // Restore note from session snapshot
  useEffect(() => {
    if (session?.context_snapshot?.text_note && !isNoteHydrated) {
      setNote(session.context_snapshot.text_note);
      setIsNoteHydrated(true);
    }
  }, [session, isNoteHydrated]);

  const handleCompleteTask = async () => {
    if (activeState?.taskId) {
      try {
        await tasks.complete(activeState.taskId);
      } catch (err) {
        console.error("Failed to complete task", err);
      }
    } else if (session?.task_id) {
      try {
        await tasks.complete(session.task_id);
      } catch (err) {
        console.error("Failed to complete task", err);
      }
    }

    // Complete the focus session if it exists
    const sessionId = session?.id || activeState?.sessionId;
    if (sessionId) {
      try {
        await markSessionComplete(sessionId);
      } catch (err) {
        console.error("Failed to complete focus session", err);
      }
    }

    clearSession();

    navigate("/dashboard");
    open({
      type: "success",
      title: "Mission Complete",
      message: "Task completed successfully.",
    });
  };

  const handleLockIn = () => {
    const payloadSessionId = session?.id || (activeState as any)?.sessionId;

    if (!payloadSessionId) {
      console.error("No Session ID found!", { session, activeState });
      open({
        type: "error",
        title: "Navigation Failed",
        message:
          "Could not find an active session ID. Please try restarting your session from the dashboard.",
      });
      return;
    }

    // Navigate to context save page with session data
    // Extract checklist items if available
    const initialChecklist =
      session?.context_snapshot?.ai_resume_checklist?.map((i) => i.text) || [];

    navigate("/context-save", {
      state: {
        sessionId: payloadSessionId,
        title: activeState?.title,
        note: note,
        gitState: activeGitState,
        initialTabs: restoredTabs,
        initialChecklist: initialChecklist,
      },
    });
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    setIsAiLoading(true);
    try {
      const response = await askAI(aiQuestion);
      setAiAnswer({ text: response.answer, sources: response.sources });
    } catch (err) {
      console.error(err);
      open({
        type: "error",
        title: "AI Error",
        message: "Failed to get an answer from the AI.",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim() || !session?.id) return;

    // Optimistic Update
    const newItem = {
      text: newChecklistItem,
      is_completed: false,
      source: "user",
    };

    if (session.context_snapshot) {
      setSession({
        ...session,
        context_snapshot: {
          ...session.context_snapshot,
          ai_resume_checklist: [
            ...(session.context_snapshot.ai_resume_checklist || []),
            newItem as any,
          ],
        },
      });
    }
    setNewChecklistItem("");

    try {
      const response = await addToChecklist(session.id, newChecklistItem);
      if ((response as any).success && session) {
        // Sync with server response to get real IDs/state if needed
        setSession((prev) =>
          prev
            ? {
                ...prev,
                context_snapshot: (response as any).data.snapshot,
              }
            : prev,
        );
      }
    } catch (err) {
      console.error("Failed to add checklist item", err);
      open({
        type: "error",
        title: "Error",
        message: "Failed to add checklist item.",
      });
      // Revert optimistic update? For now assume success or user retry.
    }
  };

  const handleGenerateAIChecklist = async () => {
    if (!session?.id) return;
    setIsGeneratingChecklist(true);
    try {
      const response = await generateAIChecklist(session.id);
      if ((response as any).success && session) {
        setSession({
          ...session,
          context_snapshot: (response as any).data.snapshot,
        });
      }
    } catch (err) {
      console.error("Failed to generate checklist", err);
      open({
        type: "error",
        title: "AI Error",
        message: "Failed to generate checklist.",
      });
    } finally {
      setIsGeneratingChecklist(false);
    }
  };

  const handleToggleChecklist = async (index: number) => {
    if (!session?.id) return;

    // Optimistic toggle
    const currentList = session.context_snapshot?.ai_resume_checklist || [];
    const newList = [...currentList];
    const item = { ...newList[index] } as any;
    item.is_completed = !item.is_completed;
    newList[index] = item;

    if (session.context_snapshot) {
      setSession({
        ...session,
        context_snapshot: {
          ...session.context_snapshot,
          ai_resume_checklist: newList,
        },
      });
    }

    try {
      await toggleChecklistItem(session.id, index);
    } catch (err) {
      console.error("Failed to toggle checklist item", err);
    }
  };

  if (!activeState) {
    return (
      <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
        <main className="flex-1 flex flex-col items-center justify-center h-screen w-full transition-all duration-300">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-light text-muted-foreground">
              No active mission
            </h2>
            <Button onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 overflow-hidden">
      <main className="flex-1 transition-all duration-300 flex relative">
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
          <div className="w-full h-1 bg-border/20">
            <div className="h-full bg-linear-to-r from-primary to-blue-400 w-full animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-5xl mx-auto p-8 md:p-12 space-y-12 min-h-full flex flex-col">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 animate-fade-in">
                  <Badge
                    variant="warning"
                    className="rounded-full px-3 py-1 bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                  >
                    HIGH PRIORITY
                  </Badge>
                  <span className="text-sm font-mono text-muted-foreground uppercase tracking-widest text-[10px]">
                    {activeState.isFreestyle
                      ? "FREESTYLE_MODE"
                      : "PLANNED_SESSION"}
                  </span>
                </div>

                <div className="space-y-2 animate-slide-in-from-bottom">
                  <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground flex items-center gap-4">
                    <span className="p-3 bg-primary/10 rounded-xl text-primary">
                      <Terminal size={32} strokeWidth={1.5} />
                    </span>
                    {activeState.title}
                  </h1>
                  <p className="text-muted-foreground text-lg font-light pl-1">
                    Focus mode engaged. Eliminate distractions.
                  </p>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] space-y-8 py-8">
                <div className="relative group cursor-default select-none transition-all">
                  <div
                    className={cn(
                      "text-7xl md:text-9xl leading-none font-mono font-bold tracking-tighter tabular-nums text-foreground transition-all duration-300",
                      isPaused && "opacity-50",
                    )}
                  >
                    {formatTime(timer)}
                  </div>
                </div>

                <div className="flex items-center gap-6 z-10">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full border-2 border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-300"
                    onClick={togglePause}
                  >
                    {isPaused ? (
                      <Play className="w-6 h-6 fill-current translate-x-0.5" />
                    ) : (
                      <Pause className="w-6 h-6 fill-current" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="h-14 px-6 rounded-full border-2 border-border hover:border-primary/50 hover:bg-primary/5 gap-2 transition-all duration-300 text-sm font-medium"
                    onClick={() => setTimer((t: number) => t + 300)}
                  >
                    <Plus className="w-4 h-4" />
                    <span>5m</span>
                  </Button>
                </div>
              </div>

              <div className="w-full space-y-4 animate-fade-in delay-75">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 " /> AI Assistant
                </h3>
                <Card className="bg-card/40 border-border/40 p-4 space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask about your knowledge base..."
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && !e.shiftKey && handleAskAI()
                      }
                      className="bg-background/50 border-muted-foreground/20 focus-visible:ring-blue-500/30"
                    />
                    <Button
                      size="icon"
                      onClick={handleAskAI}
                      disabled={isAiLoading || !aiQuestion.trim()}
                      className="bg-purple-600 hover:bg-purple-700 w-10 shrink-0"
                    >
                      {isAiLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {aiAnswer && (
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 animate-in fade-in slide-in-from-top-1">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                        {aiAnswer.text}
                      </p>
                      {aiAnswer.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-500/20 text-xs text-muted-foreground">
                          <span className="font-semibold text-blue-400">
                            Sources:
                          </span>{" "}
                          {aiAnswer.sources.length} reosurces used
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>

              <div className="w-full space-y-4 animate-fade-in delay-75">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Session
                    Checklist
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                    onClick={handleGenerateAIChecklist}
                    disabled={isGeneratingChecklist}
                  >
                    {isGeneratingChecklist ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 mr-1" />
                    )}
                    AI Generate
                  </Button>
                </div>

                <div className="flex gap-2 mb-4">
                  <Input
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="Add a new item..."
                    className="h-9 bg-card/40 border-border/40 text-sm"
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddChecklistItem()
                    }
                  />
                  <Button
                    size="sm"
                    className="h-9 w-9 p-0 shrink-0"
                    onClick={handleAddChecklistItem}
                    disabled={!newChecklistItem.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[...(session?.context_snapshot?.ai_resume_checklist || [])]
                    .length > 0 ? (
                    session?.context_snapshot?.ai_resume_checklist?.map(
                      (item, i) => (
                        <Card
                          key={i}
                          onClick={() => handleToggleChecklist(i)}
                          className={cn(
                            "transition-all cursor-pointer group select-none relative overflow-hidden border",
                            (item as any).is_completed
                              ? "bg-primary/5 border-primary/20 hover:bg-primary/10 shadow-sm"
                              : "bg-card/40 border-border/40 hover:bg-card/60 hover:border-primary/20 hover:shadow-sm",
                          )}
                        >
                          <div className="p-3 flex items-start gap-3">
                            <div
                              className={cn(
                                "mt-0.5 h-4 w-4 shrink-0 rounded-md border transition-all duration-300 flex items-center justify-center shadow-sm",
                                (item as any).is_completed
                                  ? "bg-primary border-primary text-primary-foreground scale-100"
                                  : "border-muted-foreground/30 group-hover:border-primary/50 bg-background/50",
                              )}
                            >
                              {(item as any).is_completed && (
                                <Check className="w-2.5 h-2.5 stroke-[3px]" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <div
                                className={cn(
                                  "text-sm font-medium leading-relaxed transition-all duration-300",
                                  (item as any).is_completed
                                    ? "text-muted-foreground line-through decoration-primary/30"
                                    : "text-foreground/90 group-hover:text-foreground",
                                )}
                              >
                                {item.text}
                              </div>
                              <div className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider flex items-center gap-1">
                                <span
                                  className={cn(
                                    "w-1 h-1 rounded-full",
                                    item.source === "ai"
                                      ? "bg-purple-500/50"
                                      : "bg-blue-500/50",
                                  )}
                                />
                                {item.source}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ),
                    )
                  ) : (
                    <div className="col-span-2 text-center text-muted-foreground text-sm italic py-4">
                      No checklist items available.
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full space-y-4 animate-fade-in delay-100">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Session Log
                  </label>
                  <span className="text-xs text-muted-foreground/50 font-mono">
                    markdown supported
                  </span>
                </div>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Record your progress, barriers, and breakthroughs..."
                  className="min-h-[140px] bg-card/30 border-muted rounded-xl p-6 text-base focus:ring-primary/20 focus:border-primary transition-all resize-none font-sans"
                />
              </div>

              <div className="pt-8 flex items-center justify-between border-t border-border/20">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard")}
                  className="text-muted-foreground hover:text-foreground hover:bg-transparent px-0 hover:underline underline-offset-4"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>

                <Button
                  size="lg"
                  className="h-12 rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 text-sm font-semibold bg-primary hover:bg-primary/90 transition-all active:scale-95"
                  onClick={() => setIsEndSessionModalOpen(true)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> End Session
                </Button>
              </div>
            </div>
          </div>
        </div>

        <aside
          className={cn(
            "border-l border-border bg-card/10 backdrop-blur-xl transition-all duration-300 relative flex flex-col z-20",
            isContextCollapsed
              ? "w-0 border-l-0 opacity-0 overflow-hidden"
              : "w-[380px] opacity-100",
          )}
        >
          {/* ... (Sidebar Content) ... */}
          <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-purple-400" /> Active
                Context
              </h3>
              <div className="flex items-center gap-2">
                {session?.context_snapshot?.quality_score !== undefined && (
                  <div
                    className="px-1 cursor-pointer hover:scale-105 transition-transform pb-1"
                    title="View Scoring Criteria"
                    onClick={(e) => {
                      e.stopPropagation();
                      open({
                        type: "info",
                        title: "Context Quality Score",
                        message:
                          "Your score reflects the richness of your captured context:\n\n• Browser Tabs (Documentation, PRs)\n• Git Activity (Changes, Branches)\n• Checklist Items (Progress)\n\nA higher score helps the AI understand your work better.",
                      });
                    }}
                  >
                    <QualityScoreBadge
                      score={session.context_snapshot.quality_score}
                      className="h-5"
                      showLabel={false}
                    />
                  </div>
                )}
                <div
                  className="cursor-pointer hover:opacity-80 pb-1 p-1 rounded-md hover:bg-muted/50 transition-colors"
                  onClick={() => setIsContextCollapsed(true)}
                  title="Collapse Sidebar"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </div>
              </div>
            </div>

            {activeGitState &&
              (activeGitState.additions > 0 ||
                activeGitState.deletions > 0 ||
                activeGitState.files_changed.length > 0) && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Branch</span>
                      <Badge
                        variant="outline"
                        className="border-purple-500/30 text-purple-400 font-mono bg-purple-500/10"
                      >
                        {activeGitState.branch || "unknown"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Changed Files ({activeGitState.files_changed.length})
                      </span>
                      <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                        {activeGitState.files_changed.map((file: any, i) => (
                          <div
                            key={i}
                            className="flex flex-col gap-1 p-2 rounded bg-card/40 border border-border/50 text-xs"
                          >
                            <div
                              className="font-mono truncate"
                              title={file.file || file}
                            >
                              {file.file || file}
                            </div>
                            {(file.additions !== undefined ||
                              file.deletions !== undefined) && (
                              <div className="flex items-center gap-3 opacity-80">
                                <span className="text-emerald-500 flex items-center gap-0.5">
                                  <Plus className="w-2 h-2" /> {file.additions}
                                </span>
                                <span className="text-red-500 flex items-center gap-0.5">
                                  <div className="w-1.5 h-px bg-current" />{" "}
                                  {file.deletions}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono border-t border-purple-500/20 pt-3">
                      <div className="flex items-center gap-1.5 text-emerald-500">
                        <Plus className="w-3 h-3" />
                        <span>{activeGitState.additions} additions</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-red-500">
                        <div className="w-3 h-px bg-current" />
                        <span>{activeGitState.deletions} deletions</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5" /> Restored Tabs
              </h3>
              <div className="space-y-2">
                {restoredTabs.map((tab, i) => (
                  <div
                    key={i}
                    onClick={() => window.open(tab.url, "_blank")}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card/20 border border-border/30 hover:bg-card/40 transition-colors cursor-pointer group"
                  >
                    <div className="h-6 w-6 rounded bg-background/50 flex items-center justify-center text-[10px] uppercase font-bold text-muted-foreground border border-border/30">
                      {tab.title.substring(0, 2)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                        {tab.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate font-mono opacity-70">
                        {tab.url}
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-amber-500" /> Notifications
              </h3>
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-emerald-500">
                    Optimized for Flow
                  </div>
                  <div className="text-xs text-emerald-500/60 mt-0.5">
                    Only urgent alerts allowed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div
          className={cn(
            "absolute top-6 right-6 z-50 transition-all duration-300",
            isContextCollapsed
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-10 pointer-events-none",
          )}
        >
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border border-border bg-background shadow-lg"
            onClick={() => setIsContextCollapsed(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <EndSessionModal
          isOpen={isEndSessionModalOpen}
          onClose={() => setIsEndSessionModalOpen(false)}
          onComplete={handleCompleteTask}
          onPause={handleLockIn}
          title={activeState.title}
        />
      </main>
    </div>
  );
}
