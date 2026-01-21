import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "../../../shared/components/UI/Card";
import { cn } from "../../../shared/lib/utils";

interface StatsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  subValue?: string;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  className?: string;
  color?: string;
  bgColor?: string;
}

export function StatsCard({
  icon: Icon,
  value,
  label,
  subValue,
  trend,
  className,
  color = "text-primary",
  bgColor = "bg-primary/10",
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-transparent",
        bgColor,
        className,
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
                "text-xs font-medium px-2 py-1 rounded-full bg-background border border-border/50 flex items-center gap-1",
                trend.positive ? "text-emerald-500" : "text-amber-500",
              )}
            >
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        <div className="space-y-1 relative z-10">
          <h4 className="text-3xl font-light tracking-tight text-foreground">
            {value}
          </h4>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {subValue && (
              <span className="text-xs text-muted-foreground/60">
                • {subValue}
              </span>
            )}
          </div>
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
