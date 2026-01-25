import { useEffect, useCallback } from "react";
import { CheckCircle2, Save, X, ArrowRight } from "lucide-react";
import { cn } from "../../../shared/lib/utils";

interface EndSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onPause: () => void;
  title: string;
}

export function EndSessionModal({
  isOpen,
  onClose,
  onComplete,
  onPause,
  title,
}: EndSessionModalProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-100 animate-in fade-in duration-200 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-card border border-border/50 p-8 text-left shadow-2xl transition-all animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-light tracking-tight text-foreground">
              End Session
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              What's the status of{" "}
              <span className="font-medium text-foreground">"{title}"</span>?
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onComplete}
            className={cn(
              "group relative flex flex-col p-6 rounded-xl border-2 transition-all duration-300 text-left",
              "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10",
            )}
          >
            <div className="p-3 w-fit rounded-full bg-emerald-500/10 text-emerald-500 mb-4 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
              Task Complete
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mark as done and view your session summary. No context saving
              needed.
            </p>
            <div className="mt-6 flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity">
              Finish Task <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </button>

          <button
            onClick={onPause}
            className={cn(
              "group relative flex flex-col p-6 rounded-xl border-2 transition-all duration-300 text-left",
              "border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10",
            )}
          >
            <div className="p-3 w-fit rounded-full bg-purple-500/10 text-purple-500 mb-4 group-hover:scale-110 transition-transform duration-300">
              <Save className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-2">
              Pause & Save Context
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Create a context snapshot to resume exactly where you left off
              later.
            </p>
            <div className="mt-6 flex items-center text-xs font-medium text-purple-600 dark:text-purple-400 opacity-60 group-hover:opacity-100 transition-opacity">
              Create Snapshot <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
