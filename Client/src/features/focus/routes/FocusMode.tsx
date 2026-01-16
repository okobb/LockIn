import { useEffect, useState } from "react";
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
  Mic,
  Save,
  Play,
  ArrowRight,
  Monitor,
  Terminal,
} from "lucide-react";
import { useModal } from "../../../shared/context/ModalContext";
import { useFocusSession } from "../hooks/useFocusSession";
import { getGitStatus, type GitStatusResponse } from "../api/focusApi";
import Sidebar from "../../../shared/components/Sidebar/Sidebar";
import { cn } from "../../../shared/lib/utils";
import { Button } from "../../../shared/components/UI/Button";
import { Card } from "../../../shared/components/UI/Card";
import { Badge } from "../../../shared/components/UI/Badge";
import { Textarea } from "../../../shared/components/UI/Textarea";

interface FocusState {
  taskId?: number;
  title: string;
  isFreestyle?: boolean;
  sessionId?: number;
}

export default function FocusMode() {
  const location = useLocation();
  const navigate = useNavigate();
  const { open } = useModal();

  const locationState = location.state as FocusState | null;
  const [restoredState, setRestoredState] = useState<FocusState | null>(null);

  const activeState = locationState || restoredState;

  const { session } = useFocusSession(activeState);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isContextCollapsed, setIsContextCollapsed] = useState(false);
  const [timer, setTimer] = useState(25 * 60); // 25 minutes in seconds
  const [isPaused, setIsPaused] = useState(false);

  const [note, setNote] = useState("");

  useEffect(() => {
    // Try to restore from localStorage if no location state
    if (!locationState) {
      const stored = localStorage.getItem("current_focus_session");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log("Restoring session from storage:", parsed);
          setRestoredState(parsed);
        } catch (e) {
          console.error("Failed to parse stored session", e);
        }
      }
    }
  }, [locationState]);

  // Timer logic
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

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
    navigate("/context-save", {
      state: {
        sessionId: payloadSessionId,
        title: activeState?.title,
        note: note,
        gitState: activeGitState,
        initialTabs: restoredTabs,
      },
    });
  };

  if (!activeState) {
    return (
      <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main
          className={cn(
            "flex-1 flex flex-col items-center justify-center h-screen w-full transition-all duration-300",
            isSidebarCollapsed ? "pl-[64px]" : "pl-[260px]"
          )}
        >
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
      <Sidebar
        isCollapsed={true}
        onToggleCollapse={() => {}}
        hideToggle={true}
      />

      <main
        className={cn(
          "flex-1 transition-all duration-300 flex relative",
          "pl-[64px]"
        )}
      >
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
                      isPaused && "opacity-50"
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
                    onClick={() => setTimer((t) => t + 300)}
                  >
                    <Plus className="w-4 h-4" />
                    <span>5m</span>
                  </Button>
                </div>
              </div>

              <div className="w-full space-y-4 animate-fade-in delay-75">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Session Checklist
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      text: "Check session.php config",
                      sub: "config/session.php",
                    },
                    { text: "Verify refresh tokens", sub: "DB check required" },
                    { text: "Test OAuth flow", sub: "Enable verbose logging" },
                    { text: "Commit Fixes", sub: "feature/oauth-refactor" },
                  ].map((item, i) => (
                    <Card
                      key={i}
                      className="bg-card/40 border-border/40 hover:bg-card/60 hover:border-primary/30 transition-all cursor-pointer group"
                    >
                      <div className="p-3 flex items-start gap-3">
                        <div className="mt-0.5 h-4 w-4 rounded-sm border border-muted-foreground/40 group-hover:border-primary transition-colors" />
                        <div className="flex-1">
                          <div className="text-sm font-medium leading-none group-hover:text-primary transition-colors text-foreground/90">
                            {item.text}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1.5 font-mono">
                            {item.sub}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="w-full space-y-4 animate-fade-in delay-100">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mic className="w-4 h-4" /> Session Log
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
                  onClick={handleLockIn}
                >
                  <Save className="w-4 h-4 mr-2" /> Lock In Context
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
              : "w-[380px] opacity-100"
          )}
        >
          <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-8">
            {activeGitState && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5 text-purple-400" /> Active
                    Context
                  </h3>
                  <ChevronRight
                    className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    onClick={() => setIsContextCollapsed(true)}
                  />
                </div>
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Branch</span>
                    <Badge
                      variant="outline"
                      className="border-purple-500/30 text-purple-400 font-mono bg-purple-500/10"
                    >
                      {activeGitState.branch}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">File</span>
                    <span className="font-mono text-foreground/80">
                      {activeGitState.files_changed[0]}
                    </span>
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
              : "opacity-0 translate-x-10 pointer-events-none"
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
      </main>
    </div>
  );
}
