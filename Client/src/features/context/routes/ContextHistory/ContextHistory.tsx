import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  History,
  Search,
  Calendar,
  Clock,
  Mic,
  Globe,
  FileCode,
  Play,
  Trash2,
  RotateCcw,
  Timer,
} from "lucide-react";
import Sidebar from "../../../../shared/components/Sidebar/Sidebar";
import { Button } from "../../../../shared/components/UI/Button";
import { Card, CardContent } from "../../../../shared/components/UI/Card";
import { Badge } from "../../../../shared/components/UI/Badge";
import { Input } from "../../../../shared/components/UI/Input";
import { cn } from "../../../../shared/lib/utils";
import { useModal } from "../../../../shared/context/ModalContext";
import { QualityScoreBadge } from "../../../../shared/components/QualityScoreBadge/QualityScoreBadge";
import {
  getContextHistory,
  deleteSession,
  type FocusSessionHistory,
  type ContextHistoryStats,
} from "../../api/contextHistoryApi";

type FilterStatus = "all" | "completed" | "abandoned";

export default function ContextHistory() {
  const navigate = useNavigate();
  const { open, confirm } = useModal();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sessions, setSessions] = useState<FocusSessionHistory[]>([]);
  const [stats, setStats] = useState<ContextHistoryStats>({
    total_contexts: 0,
    this_week: 0,
    time_saved_minutes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

  // Fetch data
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await getContextHistory({
          search: searchQuery || undefined,
          status: activeFilter,
        });
        setSessions(response.data.sessions.data);
        setStats(response.data.stats);
      } catch (error) {
        console.error("Failed to fetch context history", error);
        open({
          type: "error",
          title: "Error",
          message: "Failed to load context history. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(fetchHistory, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter, open]);

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const groups: Record<string, FocusSessionHistory[]> = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    sessions.forEach((session) => {
      const sessionDate = new Date(session.ended_at || session.started_at);
      let groupKey: string;

      if (sessionDate.toDateString() === today.toDateString()) {
        groupKey = "Today";
      } else if (sessionDate.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday";
      } else if (
        sessionDate > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      ) {
        groupKey = "This Week";
      } else {
        groupKey = sessionDate.toLocaleDateString("default", {
          month: "short",
          day: "numeric",
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(session);
    });

    return groups;
  }, [sessions]);

  const handleSessionClick = (session: FocusSessionHistory) => {
    navigate(`/context-history/${session.id}`, { state: { session } });
  };

  const handleResume = async (
    session: FocusSessionHistory,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    const tabCount = session.context_snapshot?.browser_state?.length || 0;

    if (tabCount > 0) {
      const shouldRestore = await confirm(
        "Restore Browser Tabs?",
        `Would you like to restore ${tabCount} browser tab${tabCount > 1 ? "s" : ""} from this session?`,
      );

      if (shouldRestore) {
        // Open tabs in new windows
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

  const handleDelete = async (
    session: FocusSessionHistory,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    const confirmed = await confirm(
      "Delete Context?",
      `Are you sure you want to delete "${session.title}"? This action cannot be undone.`,
    );

    if (confirmed) {
      try {
        await deleteSession(session.id);
        setSessions((prev) => prev.filter((s) => s.id !== session.id));
        setStats((prev) => ({
          ...prev,
          total_contexts: prev.total_contexts - 1,
        }));
      } catch (error) {
        open({
          type: "error",
          title: "Error",
          message: "Failed to delete context. Please try again.",
        });
      }
    }
  };

  const formatDuration = (minutes: number | undefined): string => {
    if (!minutes) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300 font-sans selection:bg-primary/20">
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
        <div className="w-full h-full px-6 py-8 md:px-10 md:py-12 max-w-5xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <History className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Context History
              </h1>
            </div>
            <p className="text-muted-foreground ml-14">
              Your saved cognitive snapshots
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard
              icon={RotateCcw}
              value={stats.total_contexts}
              label="Total Contexts"
              color="text-primary"
              bg="bg-primary/10"
            />
            <StatCard
              icon={Calendar}
              value={stats.this_week}
              label="This Week"
              color="text-blue-500"
              bg="bg-blue-500/10"
            />
            <StatCard
              icon={Timer}
              value={formatDuration(stats.time_saved_minutes)}
              label="Time Saved"
              color="text-emerald-500"
              bg="bg-emerald-500/10"
            />
          </section>

          <Card className="mb-8 bg-card/40 border-border/40">
            <CardContent className="p-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search contexts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-muted-foreground/20"
                />
              </div>
              <div className="flex gap-2">
                {(["all", "completed", "abandoned"] as FilterStatus[]).map(
                  (filter) => (
                    <Button
                      key={filter}
                      variant={activeFilter === filter ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(filter)}
                      className={cn(
                        "capitalize",
                        activeFilter === filter && "shadow-sm",
                      )}
                      disabled={filter === "abandoned" && false} // Keep enabled for now
                    >
                      {filter === "all" ? "All" : filter}
                    </Button>
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20">
              <History className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-medium text-muted-foreground mb-2">
                No contexts found
              </h3>
              <p className="text-sm text-muted-foreground/60">
                Start a focus session and save your context to see it here.
              </p>
            </div>
          ) : (
            <div className="relative pl-8">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border/40" />

              {Object.entries(groupedSessions).map(([date, dateSessions]) => (
                <div key={date} className="mb-8">
                  <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    {date}
                  </div>

                  <div className="space-y-4">
                    {dateSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleSessionClick(session)}
                        className={cn(
                          "relative group cursor-pointer transition-all duration-200",
                          "hover:translate-x-1",
                        )}
                      >
                        <div
                          className={cn(
                            "absolute -left-8 top-4 w-3 h-3 rounded-full border-[3px] border-background",
                            session.status === "completed"
                              ? "bg-primary"
                              : "bg-amber-500",
                          )}
                        />

                        <Card
                          className={cn(
                            "bg-card/40 border-border/40 transition-all duration-200",
                            "group-hover:bg-card/60 group-hover:border-primary/30 group-hover:shadow-lg",
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {session.title}
                                  </h4>
                                  <Badge
                                    variant={
                                      session.status === "completed"
                                        ? "default"
                                        : "warning"
                                    }
                                    className={cn(
                                      "text-xs",
                                      session.status === "completed"
                                        ? "bg-primary/10 text-primary border-primary/20"
                                        : "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                    )}
                                  >
                                    {session.status === "completed"
                                      ? "Completed"
                                      : "Abandoned"}
                                  </Badge>
                                </div>
                              </div>
                              <span className="text-xs font-mono text-muted-foreground">
                                {formatTime(
                                  session.ended_at || session.started_at,
                                )}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                              {session.context_snapshot?.git_files_changed &&
                                session.context_snapshot.git_files_changed
                                  .length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <FileCode className="w-3.5 h-3.5" />
                                    {
                                      session.context_snapshot.git_files_changed
                                        .length
                                    }{" "}
                                    files changed
                                  </span>
                                )}
                              {session.context_snapshot?.voice_memo_path && (
                                <span className="flex items-center gap-1">
                                  <Mic className="w-3.5 h-3.5" />
                                  Voice memo
                                </span>
                              )}
                              {session.context_snapshot?.browser_state &&
                                session.context_snapshot.browser_state.length >
                                  0 && (
                                  <span className="flex items-center gap-1">
                                    <Globe className="w-3.5 h-3.5" />
                                    {
                                      session.context_snapshot.browser_state
                                        .length
                                    }{" "}
                                    tabs
                                  </span>
                                )}
                              {session.actual_duration_min && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatDuration(session.actual_duration_min)}
                                </span>
                              )}
                            </div>

                            {session.context_snapshot?.voice_transcript && (
                              <div className="p-3 bg-background/50 border-l-2 border-primary rounded-r-lg text-sm text-muted-foreground italic mb-3">
                                "
                                {session.context_snapshot.voice_transcript.slice(
                                  0,
                                  120,
                                )}
                                {session.context_snapshot.voice_transcript
                                  .length > 120
                                  ? "..."
                                  : ""}
                                "
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-border/20">
                              <div className="flex items-center gap-2">
                                {session.context_snapshot?.quality_score !==
                                  undefined && (
                                  <QualityScoreBadge
                                    score={
                                      session.context_snapshot.quality_score
                                    }
                                    showLabel={false}
                                    className="h-5"
                                  />
                                )}
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {session.status === "abandoned" && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="h-7 text-xs"
                                    onClick={(e) => handleResume(session, e)}
                                  >
                                    <Play className="w-3 h-3 mr-1" />
                                    Resume
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={(e) => handleDelete(session, e)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
  bg,
}: {
  icon: React.ElementType;
  value: number | string;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <Card className={cn("overflow-hidden", bg)}>
      <CardContent className="p-4 text-center">
        <div
          className={cn("inline-flex p-2 rounded-lg mb-2", "bg-background/50")}
        >
          <Icon className={cn("w-5 h-5", color)} />
        </div>
        <div className={cn("text-2xl font-bold", color)}>{value}</div>
        <div className="text-sm text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
      </CardContent>
    </Card>
  );
}
