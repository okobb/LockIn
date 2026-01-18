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
    <Card className={cn("overflow-hidden h-full", className)}>
      <CardContent className="p-4 flex items-start justify-between h-full">
        <div>
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
            {label}
          </div>
          <div className="text-2xl font-bold mb-1">{value}</div>
          {subValue && (
            <div className="text-xs text-muted-foreground">{subValue}</div>
          )}
          {trend && (
            <div
              className={cn(
                "text-xs font-medium mt-2 flex items-center gap-1",
                trend.positive ? "text-green-500" : "text-red-500",
              )}
            >
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
              {trend.label}
            </div>
          )}
        </div>
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
      </CardContent>
    </Card>
  );
}
