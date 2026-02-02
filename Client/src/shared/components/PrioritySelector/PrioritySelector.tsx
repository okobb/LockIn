import { cn } from "../../lib/utils";

export type Priority = "urgent" | "high" | "medium" | "low";

interface PrioritySelectorProps {
  value: Priority;
  onChange: (value: Priority) => void;
  className?: string;
}

export const PrioritySelector = ({
  value,
  onChange,
  className,
}: PrioritySelectorProps) => {
  const priorities: Priority[] = ["urgent", "high", "medium", "low"];

  return (
    <div className={cn("flex gap-2", className)}>
      {priorities.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={cn(
            "flex-1 items-center justify-center rounded-md text-xs font-medium py-2 px-3 border transition-all capitalize",
            value === p
              ? "ring-2 ring-primary border-primary/50 bg-primary/5"
              : "border-input hover:bg-accent hover:text-accent-foreground",
            p === "urgent" &&
              value === "urgent" &&
              "text-red-500 bg-red-500/10 border-red-500/20 ring-red-500/30",
            p === "high" &&
              value === "high" &&
              "text-orange-500 bg-orange-500/10 border-orange-500/20 ring-orange-500/30",
            p === "medium" &&
              value === "medium" &&
              "text-blue-500 bg-blue-500/10 border-blue-500/20 ring-blue-500/30",
            p === "low" &&
              value === "low" &&
              "text-slate-500 bg-slate-500/10 border-slate-500/20 ring-slate-500/30",
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
};
