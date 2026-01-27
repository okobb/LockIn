import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Calendar as CalendarIcon,
  ArrowRight,
  Zap,
  Layers,
  Activity,
} from "lucide-react";
import Sidebar from "../../../../shared/components/Sidebar/Sidebar";
import { useDashboard } from "../../hooks/useDashboard";
import { useSessionContext } from "../../../focus/context/SessionContext";
import { getSession } from "../../../focus/api/focusApi";
import { Button } from "../../../../shared/components/UI/Button";
import { Card, CardContent } from "../../../../shared/components/UI/Card";
import { cn } from "../../../../shared/lib/utils";
import MissionBar from "../../components/MissionBar/MissionBar";
import {
  Skeleton,
  CardSkeleton,
} from "../../../../shared/components/Skeleton/Skeleton";
import { LiquidSuggestions } from "../../components/LiquidSuggestions";

export default function NewDashboard() {
  const {
    stats,
    priorityTasks,
    upcomingEvents,
    isLoadingStats,
    isLoadingPriority,
    isLoadingUpcoming,
  } = useDashboard();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { activeSession, clearSession } = useSessionContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeSession?.sessionId) {
      getSession(activeSession.sessionId)
        .then((session) => {
          if (
            session.status === "completed" ||
            session.status === "abandoned" ||
            session.ended_at
          ) {
            clearSession();
          }
        })
        .catch(() => {
          clearSession();
        });
    }
  }, [activeSession?.sessionId, clearSession]);

  const handleResumeSession = () => {
    if (activeSession) {
      navigate("/focus", {
        state: {
          taskId: activeSession.taskId,
          title: activeSession.title,
          sessionId: activeSession.sessionId,
          isFreestyle: activeSession.isFreestyle,
        },
      });
    } else {
      navigate("/focus");
    }
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
        <div className="w-full h-full px-6 py-8 md:px-10 md:py-12 space-y-12">
          <header className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              {new Date().toLocaleDateString("default", { weekday: "long" })},{" "}
              <span className="opacity-60">
                {new Date().toLocaleDateString("default", { month: "long" })}
              </span>{" "}
              {new Date().getDate()}
            </h1>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingStats ? (
              Array(4)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
            ) : (
              <>
                <StatCard
                  label="Flow Time"
                  value={stats.flowTime}
                  icon={Zap}
                  color="text-warning"
                  bg="bg-warning/10"
                />
                <StatCard
                  label="Contexts Saved"
                  value={stats.contextsSaved}
                  unit="sessions"
                  icon={RotateCcw}
                  color="text-primary"
                  bg="bg-primary/10"
                />
                <StatCard
                  label="Deep Work"
                  value={stats.deepWorkBlocks}
                  unit="blocks"
                  icon={Layers}
                  color="text-primary"
                  bg="bg-primary/10"
                />
                <StatCard
                  label="Tasks Done"
                  value={stats.tasksDone}
                  unit="completed"
                  icon={CheckCircle2}
                  color="text-emerald-500"
                  bg="bg-emerald-500/10"
                />
              </>
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-7 space-y-10">
              <div className="sticky top-0 z-50 py-4 -mx-6 px-6 backdrop-blur-xl transition-all border-b border-transparent data-[stuck=true]:border-[#333]/50">
                <div className="w-full">
                  <MissionBar />
                </div>
              </div>

              {activeSession && (
                <div className="group relative rounded-3xl border border-primary/20 bg-card/40 hover:bg-card/60 transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative p-8 md:p-10 space-y-8">
                    <div className="flex items-center gap-3">
                      <span className="flex h-3 w-3 rounded-full bg-primary animate-pulse shadow-[0_0_10px_currentColor] text-primary" />
                      <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
                        Active Session
                      </span>
                    </div>

                    <div>
                      <h2 className="text-3xl md:text-4xl font-light leading-tight text-foreground">
                        {activeSession.title}
                      </h2>
                      <p className="mt-4 text-lg text-muted-foreground font-light max-w-2xl">
                        Resume your last session where you left off.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <Button
                        size="lg"
                        className="h-12 px-8 rounded-full! text-base text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
                        onClick={handleResumeSession}
                      >
                        <Play className="w-5 h-5 mr-2 fill-current" />
                        Resume Work
                      </Button>
                      <Button
                        variant="ghost"
                        size="lg"
                        className="h-12 px-8 rounded-full! text-base hover:bg-primary/5 text-foreground/80 hover:text-foreground"
                        onClick={() => navigate("/context-history")}
                      >
                        <CalendarIcon className="w-5 h-5 mr-2" /> View Timeline
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-medium tracking-tight">
                    Priority Items{" "}
                    <span className="text-muted-foreground ml-2 opacity-60">
                      ({priorityTasks.length})
                    </span>
                  </h3>
                </div>

                <div className="grid gap-4">
                  {isLoadingPriority ? (
                    Array(3)
                      .fill(0)
                      .map((_, i) => <CardSkeleton key={i} />)
                  ) : priorityTasks.length > 0 ? (
                    priorityTasks.map((task: any, i: number) => (
                      <Card
                        key={i}
                        className="group hover:border-primary/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <CardContent className="p-5 flex items-center gap-5">
                          <div className="flex-none p-3 rounded-full bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                            <Activity className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-medium group-hover:text-primary transition-colors truncate">
                              {task.title || "Untitled Task"}
                            </h4>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-3">
                              <span className="inline-block w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_currentColor] text-red-500" />
                              High Priority
                            </div>
                          </div>

                          <div className="hidden md:block text-right group-hover:opacity-0 group-hover:translate-x-4 transition-all duration-300 absolute right-5">
                            <div className="text-sm font-medium text-foreground">
                              Due Today
                            </div>
                            <div className="text-xs text-muted-foreground">
                              In 2 hours
                            </div>
                          </div>

                          <div className="absolute right-5 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                            <Button
                              size="sm"
                              className="rounded-full shadow-lg shadow-primary/20"
                              onClick={() => {
                                localStorage.removeItem(
                                  "current_focus_session",
                                );
                                navigate("/focus", {
                                  state: {
                                    taskId: task.id,
                                    title: task.title,
                                    isNewSession: true,
                                  },
                                });
                              }}
                            >
                              <Play className="w-4 h-4 mr-2 fill-current" />
                              Start Working
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="p-12 text-center border-2 border-dashed border-border/30 rounded-3xl">
                      <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-lg text-muted-foreground font-light">
                        All priority items cleared.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-10">
              <Card className="rounded-3xl bg-card border-border/20 shadow-sm">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-background rounded-xl shadow-sm">
                      <CalendarIcon className="w-5 h-5 text-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Daily Agenda</h3>
                  </div>

                  <div className="relative border-l-2 border-border/40 ml-3.5 space-y-8 py-2">
                    <LiquidSuggestions />

                    {isLoadingUpcoming ? (
                      <div className="space-y-6">
                        <Skeleton className="h-12 w-full ml-4" />
                        <Skeleton className="h-12 w-full ml-4" />
                      </div>
                    ) : upcomingEvents.length > 0 ? (
                      upcomingEvents.map((event: any, i: number) => (
                        <div
                          key={i}
                          className="group/event relative pl-8 cursor-pointer hover:bg-primary/5 rounded-xl p-2 -ml-2 transition-colors duration-200"
                          onClick={() => {
                            if (
                              event.type === "task" ||
                              event.itemType === "task"
                            ) {
                              localStorage.removeItem("current_focus_session");
                              navigate("/focus", {
                                state: {
                                  taskId: event.taskId
                                    ? parseInt(event.taskId)
                                    : undefined,
                                  title: event.title,
                                  isNewSession: true,
                                },
                              });
                            }
                          }}
                        >
                          <div
                            className={cn(
                              "absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-background transition-all group-hover/event:scale-125",
                              event.type === "focus" ||
                                event.type === "deep_work"
                                ? "bg-emerald-500 group-hover/event:bg-emerald-600"
                                : event.type === "meeting"
                                  ? "bg-blue-500 group-hover/event:bg-blue-600"
                                  : event.type === "task"
                                    ? "bg-indigo-500 group-hover/event:bg-indigo-600"
                                    : "bg-foreground group-hover/event:bg-primary",
                            )}
                          />
                          <div className="space-y-1">
                            <div className="text-sm font-mono text-muted-foreground">
                              {event.startTime
                                ? new Date(event.startTime).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                    },
                                  )
                                : event.time}
                            </div>
                            <div className="font-medium text-base group-hover/event:text-primary transition-colors">
                              {event.title}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center justify-between">
                              <span className="capitalize">
                                {event.meta || event.type || "Event"}
                              </span>
                              {(event.type === "task" || event.taskId) && (
                                <span className="text-xs opacity-0 group-hover/event:opacity-100 transition-opacity flex items-center text-primary font-medium">
                                  Start Focus{" "}
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No upcoming items.</p>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full mt-8"
                    variant="outline"
                    onClick={() => navigate("/weekly-planner")}
                  >
                    View Full Calendar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, unit, icon: Icon, trend, color, bg }: any) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-transparent",
        bg,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "p-2.5 rounded-xl transition-colors bg-background/50 border border-border/10",
            )}
          >
            <Icon className={cn("w-5 h-5", color)} />
          </div>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-full bg-background border border-border/50",
                color,
              )}
            >
              {trend}
            </span>
          )}
        </div>
        <div className="space-y-1 relative z-10">
          <h4 className="text-3xl font-light tracking-tight text-foreground">
            {value}{" "}
            <span className="text-base text-muted-foreground font-normal ml-0.5">
              {unit}
            </span>
          </h4>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
        </div>
        <div
          className={cn(
            "absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity",
            color.replace("text-", "bg-"),
          )}
        />
      </CardContent>
    </Card>
  );
}
