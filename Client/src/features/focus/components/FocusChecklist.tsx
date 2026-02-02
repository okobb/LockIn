import { LayoutDashboard, Loader2, Sparkles, Plus, Check } from "lucide-react";
import { cn } from "../../../shared/lib/utils";
import { Button } from "../../../shared/components/UI/Button";
import { Card } from "../../../shared/components/UI/Card";
import { Input } from "../../../shared/components/UI/Input";

export interface ChecklistItem {
  text: string;
  is_completed: boolean;
  source: string;
}

interface FocusChecklistProps {
  items: ChecklistItem[];
  isGenerating: boolean;
  newItemText: string;
  onNewItemChange: (text: string) => void;
  onAddItem: () => void;
  onGenerate: () => void;
  onToggleItem: (index: number) => void;
}

export function FocusChecklist({
  items,
  isGenerating,
  newItemText,
  onNewItemChange,
  onAddItem,
  onGenerate,
  onToggleItem,
}: FocusChecklistProps) {
  return (
    <div className="w-full space-y-4 animate-fade-in delay-75">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <LayoutDashboard className="w-3.5 h-3.5" /> Session Checklist
        </h3>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3 mr-1" />
          )}
          AI Generate
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          value={newItemText}
          onChange={(e) => onNewItemChange(e.target.value)}
          placeholder="Add a new item..."
          className="h-9 bg-card/40 border-border/40 text-sm"
          onKeyDown={(e) => e.key === "Enter" && onAddItem()}
        />
        <Button
          size="sm"
          className="h-9 w-9 p-0 shrink-0"
          onClick={onAddItem}
          disabled={!newItemText.trim()}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.length > 0 ? (
          items.map((item, i) => (
            <Card
              key={i}
              onClick={() => onToggleItem(i)}
              className={cn(
                "transition-all cursor-pointer group select-none relative overflow-hidden border",
                item.is_completed
                  ? "bg-primary/5 border-primary/20 hover:bg-primary/10 shadow-sm"
                  : "bg-card/40 border-border/40 hover:bg-card/60 hover:border-primary/20 hover:shadow-sm",
              )}
            >
              <div className="p-3 flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0 rounded-md border transition-all duration-300 flex items-center justify-center shadow-sm",
                    item.is_completed
                      ? "bg-primary border-primary text-primary-foreground scale-100"
                      : "border-muted-foreground/30 group-hover:border-primary/50 bg-background/50",
                  )}
                >
                  {item.is_completed && (
                    <Check className="w-2.5 h-2.5 stroke-[3px]" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div
                    className={cn(
                      "text-sm font-medium leading-relaxed transition-all duration-300",
                      item.is_completed
                        ? "text-muted-foreground line-through decoration-primary/30"
                        : "text-foreground/90 group-hover:text-foreground",
                    )}
                  >
                    {item.text}
                  </div>
                  <div className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider flex items-center gap-1">
                    <span
                      className={cn(
                        "w-1 h-1 rounded-full",
                        item.source === "ai"
                          ? "bg-purple-500/50"
                          : "bg-blue-500/50",
                      )}
                    />
                    {item.source}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center text-muted-foreground text-sm italic py-4">
            No checklist items available.
          </div>
        )}
      </div>
    </div>
  );
}
