import { Play, Pause, Plus } from "lucide-react";
import { cn } from "../../../shared/lib/utils";
import { Button } from "../../../shared/components/UI/Button";

interface FocusTimerProps {
  timer: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onAddFiveMinutes: () => void;
}

export function FocusTimer({
  timer,
  isPaused,
  onTogglePause,
  onAddFiveMinutes,
}: FocusTimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] space-y-8 py-8">
      <div className="relative group cursor-default select-none transition-all">
        <div
          className={cn(
            "text-7xl md:text-9xl leading-none font-mono font-bold tracking-tighter tabular-nums text-foreground transition-all duration-300",
            isPaused && "opacity-50",
          )}
        >
          {formatTime(timer)}
        </div>
      </div>

      <div className="flex items-center gap-6 z-10">
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-2 border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-300"
          onClick={onTogglePause}
        >
          {isPaused ? (
            <Play className="w-6 h-6 fill-current translate-x-0.5" />
          ) : (
            <Pause className="w-6 h-6 fill-current" />
          )}
        </Button>

        <Button
          variant="outline"
          className="h-14 px-6 rounded-full border-2 border-border hover:border-primary/50 hover:bg-primary/5 gap-2 transition-all duration-300 text-sm font-medium"
          onClick={onAddFiveMinutes}
        >
          <Plus className="w-4 h-4" />
          <span>5m</span>
        </Button>
      </div>
    </div>
  );
}
