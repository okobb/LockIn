import { Flame } from "lucide-react";
import { cn } from "../../../shared/lib/utils";

interface StreakDisplayProps {
  days: number;
}

export function StreakDisplay({ days }: StreakDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={cn(
          "relative rounded-full p-6 mb-3 transition-colors duration-500",
          days > 0 ? "bg-orange-500/10" : "bg-muted/10",
        )}
      >
        <Flame
          className={cn(
            "w-12 h-12 transition-all duration-500",
            days > 0
              ? "text-orange-500 fill-orange-500 animate-pulse drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]"
              : "text-muted-foreground",
          )}
        />
        {days > 0 && (
          <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping opacity-20" />
        )}
      </div>
      <div className="text-3xl font-bold text-foreground mb-1">
        {days}{" "}
        <span className="text-lg font-normal text-muted-foreground">days</span>
      </div>
      <p className="text-sm text-muted-foreground">Current Streak</p>
    </div>
  );
}
