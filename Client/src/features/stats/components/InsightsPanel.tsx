import {
  TrendingUp,
  Award,
  Target,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import type { ProductivityInsight } from "../types";
import { cn } from "../../../shared/lib/utils";
import { Card, CardContent } from "../../../shared/components/UI/Card";

interface InsightsPanelProps {
  insights: ProductivityInsight[];
}

const iconMap: Record<string, LucideIcon> = {
  "trending-up": TrendingUp,
  award: Award,
  target: Target,
  "alert-circle": AlertCircle,
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <Card className="bg-secondary/20 border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground flex flex-col items-center">
          <span className="mb-2 text-2xl">🤖</span>
          <p>Complete more sessions to unlock AI insights!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      {insights.map((insight, index) => {
        const Icon = iconMap[insight.icon] || TrendingUp;

        // Determine colors based on type
        let colorClass = "text-blue-500 bg-blue-500/10 border-blue-500/20";
        if (insight.type === "celebration")
          colorClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";
        if (insight.type === "trend")
          colorClass =
            "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
        if (insight.type === "alert")
          colorClass = "text-red-500 bg-red-500/10 border-red-500/20";

        return (
          <div
            key={index}
            className={cn(
              "flex-1 flex items-start gap-4 p-4 rounded-xl border bg-card/50 transition-all hover:bg-card hover:shadow-sm min-w-0",
              "border-border/50",
            )}
          >
            <div
              className={cn(
                "p-2.5 rounded-lg shrink-0",
                colorClass
                  .split(" ")
                  .filter((c) => c.includes("bg"))
                  .join(" "),
                colorClass
                  .split(" ")
                  .filter((c) => c.includes("text"))
                  .join(" "),
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-foreground bg-linear-to-r from-foreground to-foreground/70 bg-clip-text truncate">
                {insight.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                {insight.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
