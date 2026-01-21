import { useState, useEffect } from "react";
import {
  BarChart,
  Trophy,
  CheckSquare,
  Layers,
  Activity,
  Sparkles,
} from "lucide-react";
import Sidebar from "../../../../shared/components/Sidebar/Sidebar";
import { cn } from "../../../../shared/lib/utils";
import { useModal } from "../../../../shared/context/ModalContext";
import {
  getWeeklyStats,
  getDailyBreakdown,
  getInsights,
} from "../../api/statsApi";
import type {
  WeeklyStats,
  DailyBreakdown,
  ProductivityInsight,
} from "../../types";
import { StatsCard } from "../../components/StatsCard";
import { WeeklyChart } from "../../components/WeeklyChart";
import { GoalProgress } from "../../components/GoalProgress";
import { StreakDisplay } from "../../components/StreakDisplay";
import { InsightsPanel } from "../../components/InsightsPanel";

export default function StatsPage() {
  const { open } = useModal();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [breakdown, setBreakdown] = useState<DailyBreakdown[]>([]);
  const [insights, setInsights] = useState<ProductivityInsight[]>([]);

  const fetchData = async () => {
    try {
      const [statsRes, breakdownRes, insightsRes] = await Promise.all([
        getWeeklyStats(),
        getDailyBreakdown(),
        getInsights(),
      ]);

      setStats(statsRes.data.data);
      setBreakdown(breakdownRes.data.data);
      setInsights(insightsRes.data.data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
      open({
        type: "error",
        title: "Error",
        message: "Failed to load statistics. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGoalUpdate = () => {
    fetchData(); // Reload to get updated goal/progress
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
        <div className="w-full h-full px-6 py-8 md:px-10 md:py-12 max-w-6xl mx-auto">
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <BarChart className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  Your Progress
                </h1>
              </div>
              <p className="text-muted-foreground ml-14">
                Track your productivity and cognitive patterns
              </p>
            </div>
          </header>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : stats ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  icon={Activity}
                  label="Total Flow Time"
                  value={formatDuration(stats.flow_time_minutes)}
                  subValue="This week"
                  trend={{
                    value: Math.abs(stats.flow_time_change_percent),
                    label: "vs last week",
                    positive: stats.flow_time_change_percent >= 0,
                  }}
                  color="text-primary"
                  bgColor="bg-primary/10"
                />
                <StatsCard
                  icon={Layers}
                  label="Deep Work Blocks"
                  value={stats.deep_work_blocks}
                  subValue="Focused sessions"
                  color="text-violet-500"
                  bgColor="bg-violet-500/10"
                />
                <StatsCard
                  icon={CheckSquare}
                  label="Tasks Completed"
                  value={stats.tasks_completed}
                  subValue="Items finished"
                  color="text-emerald-500"
                  bgColor="bg-emerald-500/10"
                />
                <StatsCard
                  icon={Trophy}
                  label="Contexts Saved"
                  value={stats.contexts_saved}
                  subValue="Cognitive states"
                  color="text-amber-500"
                  bgColor="bg-amber-500/10"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card/40 border border-border/40 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Daily Focus Breakdown
                  </h3>
                  <WeeklyChart data={breakdown} />
                </div>

                <div className="space-y-6">
                  <div className="bg-card/40 border border-border/40 rounded-xl p-6">
                    <StreakDisplay days={stats.current_streak_days} />
                  </div>
                  <div className="bg-card/40 border border-border/40 rounded-xl">
                    <GoalProgress
                      currentMinutes={stats.flow_time_minutes}
                      goalMinutes={stats.weekly_goal_minutes}
                      percentage={stats.goal_progress_percent}
                      onGoalUpdate={handleGoalUpdate}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                  </div>
                  AI Insights
                </h3>
                <InsightsPanel insights={insights} />
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              Failed to load stats.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
