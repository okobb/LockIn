import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  subValue?: string;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  color?: string;
  bgColor?: string;
  className?: string;
}

export const StatCard = ({
  label,
  value,
  unit,
  icon: Icon,
  subValue,
  trend,
  color = "text-primary",
  bgColor = "bg-primary/10",
  className,
}: StatCardProps) => {
  return (
    <div
      className={cn(
        "bg-card/40 border border-border/40  backdrop-blur-sm rounded-xl p-5 hover:bg-card/60 transition-colors",
        className,
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-lg", bgColor)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              trend.positive
                ? "text-emerald-500 bg-emerald-500/10"
                : "text-rose-500 bg-rose-500/10",
            )}
          >
            {trend.positive ? "+" : "-"}
            {trend.value}% {trend.label}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium mb-1">
          {label}
        </p>
        <div className="flex items-baseline gap-1">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </h3>
          {unit && (
            <span className="text-sm font-medium text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
        {subValue && (
          <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
        )}
      </div>
    </div>
  );
};
