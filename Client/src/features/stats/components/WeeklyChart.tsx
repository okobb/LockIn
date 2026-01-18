import { cn } from "../../../shared/lib/utils";
import type { DailyBreakdown } from "../types";

interface WeeklyChartProps {
  data: DailyBreakdown[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const maxFlow = Math.max(...data.map((d) => d.flow_time_minutes), 1); // Avoid div by 0

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="w-full h-64 flex items-end justify-between gap-2 md:gap-4 px-2">
      {data.map((day) => {
        const heightPercent = (day.flow_time_minutes / maxFlow) * 100;
        const isToday = day.date === new Date().toISOString().slice(0, 10);

        return (
          <div
            key={day.date}
            className="flex-1 flex flex-col items-center group"
          >
            <div className="relative w-full flex items-end justify-center h-48 bg-secondary/20 rounded-t-lg group-hover:bg-secondary/30 transition-colors">
              <div className="absolute inset-0 rounded-t-lg overflow-hidden">
              </div>
              <div
                className={cn(
                  "w-full transition-all duration-700 ease-out rounded-t-lg relative z-10",
                  isToday
                    ? "bg-primary"
                    : "bg-primary/70 group-hover:bg-primary/90",
                )}
                style={{ height: `${heightPercent}%` }}
              >
                {day.flow_time_minutes > 0 && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs p-2 rounded-lg shadow-xl border border-border pointer-events-none z-50 min-w-[120px]">
                    <div className="font-semibold mb-1 border-b border-border/50 pb-1">
                      {day.date}
                    </div>
                    <div className="flex justify-between gap-3 text-muted-foreground">
                      <span>Focus:</span>
                      <span className="font-mono text-foreground">
                        {formatDuration(day.flow_time_minutes)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-muted-foreground">
                      <span>Tasks:</span>
                      <span className="font-mono text-foreground">
                        {day.tasks_completed}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div
              className={cn(
                "mt-3 text-xs md:text-sm font-medium",
                isToday ? "text-primary font-bold" : "text-muted-foreground",
              )}
            >
              {day.day_name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
