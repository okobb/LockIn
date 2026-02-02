import { Terminal } from "lucide-react";
import { Badge } from "../../../shared/components/UI/Badge";

interface FocusTaskProps {
  title: string;
  isFreestyle?: boolean;
}

export function FocusTask({ title, isFreestyle }: FocusTaskProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <Badge
          variant="warning"
          className="rounded-full px-3 py-1 bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
        >
          HIGH PRIORITY
        </Badge>
        <span className="text-sm font-mono text-muted-foreground uppercase tracking-widest text-[10px]">
          {isFreestyle ? "FREESTYLE_MODE" : "PLANNED_SESSION"}
        </span>
      </div>

      <div className="space-y-2 animate-slide-in-from-bottom">
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground flex items-center gap-4">
          <span className="p-3 bg-primary/10 rounded-xl text-primary">
            <Terminal size={32} strokeWidth={1.5} />
          </span>
          {title}
        </h1>
        <p className="text-muted-foreground text-lg font-light pl-1">
          Focus mode engaged. Eliminate distractions.
        </p>
      </div>
    </div>
  );
}
