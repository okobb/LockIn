import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Trash2,
  Calendar,
  Clock,
  Mic,
  Globe,
  FileCode,
  GitBranch,
  CheckCircle2,
  Circle,
  Volume2,
} from "lucide-react";
import Sidebar from "../../../../shared/components/Sidebar/Sidebar";
import { Button } from "../../../../shared/components/UI/Button";
import { Card, CardContent } from "../../../../shared/components/UI/Card";
import { Badge } from "../../../../shared/components/UI/Badge";
import { cn } from "../../../../shared/lib/utils";
import { useModal } from "../../../../shared/context/ModalContext";
import { QualityScoreBadge } from "../../../../shared/components/QualityScoreBadge/QualityScoreBadge";
import {
  getSessionDetail,
  deleteSession,
  type FocusSessionHistory,
} from "../../api/contextHistoryApi";

export default function ContextDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { open, confirm } = useModal();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [session, setSession] = useState<FocusSessionHistory | null>(
    (location.state as any)?.session || null,
  );
  const [isLoading, setIsLoading] = useState(!session);

  // Fetch session if not passed via state
  useEffect(() => {
    if (!session && sessionId) {
      const fetchSession = async () => {
        setIsLoading(true);
        try {
          const data = await getSessionDetail(Number(sessionId));
          setSession(data);
        } catch (error) {
          console.error("Failed to fetch session", error);
          open({
            type: "error",
            title: "Error",
            message: "Failed to load session details.",
          });
          navigate("/context-history");
        } finally {
          setIsLoading(false);
        }
      };
      fetchSession();
    }
  }, [sessionId, session, navigate, open]);

  const handleResume = async () => {
    if (!session) return;

    const tabCount = session.context_snapshot?.browser_state?.length || 0;

    if (tabCount > 0) {
      const shouldRestore = await confirm(
        "Restore Browser Tabs?",
        `Would you like to restore ${tabCount} browser tab${tabCount > 1 ? "s" : ""} from this session?`,
      );

      if (shouldRestore) {
        session.context_snapshot?.browser_state?.forEach((tab) => {
          window.open(tab.url, "_blank");
        });
      }
    }

    navigate("/focus", {
      state: {
        sessionId: session.id,
        title: session.title,
      },
    });
  };

  const handleDelete = async () => {
    if (!session) return;

    const confirmed = await confirm(
      "Delete Context?",
      `Are you sure you want to delete "${session.title}"? This action cannot be undone.`,
    );

    if (confirmed) {
      try {
        await deleteSession(session.id);
        navigate("/context-history");
      } catch (error) {
        open({
          type: "error",
          title: "Error",
          message: "Failed to delete context. Please try again.",
        });
      }
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("default", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number | undefined): string => {
    if (!minutes) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main
          className={cn(
            "flex-1 flex items-center justify-center",
            isSidebarCollapsed ? "pl-[64px]" : "pl-[260px]",
          )}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const snapshot = session.context_snapshot;
  const isAbandoned = session.status === "abandoned";

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main
        className={cn(
          "flex-1 overflow-y-auto h-screen w-full transition-all duration-300",
          isSidebarCollapsed ? "pl-[64px]" : "pl-[260px]",
        )}
      >
        <div className="w-full h-full px-6 py-8 md:px-10 md:py-12 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/context-history")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
            <div className="flex items-center gap-2">
              {isAbandoned && (
                <Button onClick={handleResume}>
                  <Play className="w-4 h-4 mr-2" />
                  Resume Mission
                </Button>
              )}
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                {session.title}
              </h1>
              <Badge
                variant={isAbandoned ? "warning" : "default"}
                className={cn(
                  isAbandoned
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-primary/10 text-primary border-primary/20",
                )}
              >
                {isAbandoned ? "Abandoned" : "Completed"}
              </Badge>
              {snapshot?.quality_score != null && (
                <QualityScoreBadge
                  score={snapshot.quality_score}
                  className="h-6"
                />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(session.ended_at || session.started_at)}
              </span>
              {session.actual_duration_min && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(session.actual_duration_min)}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-card/40 border-border/40">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    <Mic className="w-4 h-4" />
                    Voice Memo
                  </div>
                  {snapshot?.voice_memo_path ? (
                    <>
                      {snapshot.voice_transcript && (
                        <div className="p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg mb-4">
                          <p className="text-sm italic text-muted-foreground leading-relaxed">
                            "{snapshot.voice_transcript}"
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
                        <Button size="icon" className="rounded-full h-10 w-10">
                          <Volume2 className="w-5 h-5" />
                        </Button>
                        <div className="flex-1 h-1 bg-border rounded-full">
                          <div className="w-1/3 h-full bg-primary rounded-full" />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {snapshot.voice_duration_sec
                            ? `${Math.floor(snapshot.voice_duration_sec / 60)}:${String(snapshot.voice_duration_sec % 60).padStart(2, "0")}`
                            : "0:00"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed border-border/30 rounded-lg">
                      <Mic className="w-8 h-8 text-white/80 mx-auto mb-2" />
                      <p className="text-sm text-white/70">
                        No voice note recorded
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-border/40">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    <FileCode className="w-4 h-4" />
                    Session Notes
                  </div>
                  {snapshot?.text_note ? (
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {snapshot.text_note}
                    </p>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed border-border/30 rounded-lg">
                      <FileCode className="w-8 h-8 text-white/80 mx-auto mb-2" />
                      <p className="text-sm text-white/70">No session notes</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-border/40">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    <GitBranch className="w-4 h-4" />
                    Git Context
                  </div>
                  {snapshot?.git_branch ? (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge
                          variant="outline"
                          className="font-mono bg-purple-500/10 text-purple-400 border-purple-500/20"
                        >
                          {snapshot.git_branch}
                        </Badge>
                        {snapshot.git_files_changed && (
                          <span className="text-sm text-muted-foreground">
                            {snapshot.git_files_changed.length} files changed
                          </span>
                        )}
                      </div>
                      {snapshot.git_files_changed &&
                        snapshot.git_files_changed.length > 0 && (
                          <div className="space-y-2">
                            {snapshot.git_files_changed.map((file, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 p-2 bg-background/50 rounded text-xs font-mono text-muted-foreground"
                              >
                                <FileCode className="w-3 h-3" />
                                {file}
                              </div>
                            ))}
                          </div>
                        )}
                    </>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed border-border/30 rounded-lg">
                      <GitBranch className="w-8 h-8 text-white/80 mx-auto mb-2" />
                      <p className="text-sm text-white/70">
                        No git changes detected
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-card/40 border-border/40">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    <CheckCircle2 className="w-4 h-4" />
                    Checklist
                  </div>
                  {snapshot?.ai_resume_checklist &&
                  snapshot.ai_resume_checklist.length > 0 ? (
                    <div className="space-y-3">
                      {snapshot.ai_resume_checklist.map((item, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                            item.is_completed
                              ? "bg-primary/5 border-primary/20"
                              : "bg-background/50 border-border/30",
                          )}
                        >
                          {item.is_completed ? (
                            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1">
                            <p
                              className={cn(
                                "text-sm",
                                item.is_completed &&
                                  "line-through text-muted-foreground",
                              )}
                            >
                              {item.text}
                            </p>
                            <span className="text-[10px] uppercase text-muted-foreground/50 font-mono">
                              {item.source}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed border-border/30 rounded-lg">
                      <CheckCircle2 className="w-8 h-8 text-white/80 mx-auto mb-2" />
                      <p className="text-sm text-white/70">
                        No checklist items
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-border/40">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    <Globe className="w-4 h-4" />
                    Browser Tabs ({snapshot?.browser_state?.length || 0})
                  </div>
                  {snapshot?.browser_state &&
                  snapshot.browser_state.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {snapshot.browser_state.map((tab, i) => (
                          <a
                            key={i}
                            href={tab.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-background/50 border border-border/30 rounded-lg hover:border-primary/30 transition-colors group"
                          >
                            <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold uppercase text-muted-foreground">
                              {tab.title?.substring(0, 2) || "??"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                                {tab.title || "Untitled"}
                              </p>
                              <p className="text-[10px] font-mono text-muted-foreground truncate">
                                {tab.url}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                      {isAbandoned && (
                        <Button
                          className="w-full mt-4"
                          variant="outline"
                          onClick={() => {
                            snapshot.browser_state?.forEach((tab) => {
                              window.open(tab.url, "_blank");
                            });
                          }}
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          Restore All Tabs
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed border-border/30 rounded-lg">
                      <Globe className="w-8 h-8 text-white/80 mx-auto mb-2" />
                      <p className="text-sm text-white/70">No tabs saved</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
