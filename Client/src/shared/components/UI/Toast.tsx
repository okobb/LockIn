import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "../../../lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

const icons = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const styles = {
  success: "border-l-4 border-l-emerald-500 bg-emerald-500/10",
  error: "border-l-4 border-l-red-500 bg-red-500/10",
  info: "border-l-4 border-l-blue-500 bg-blue-500/10",
};

export function Toast({
  id,
  type,
  message,
  duration = 4000,
  onDismiss,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true); 
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, 300); 
      return () => clearTimeout(timer);
    }
  }, [isExiting, id, onDismiss]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg bg-card border border-border shadow-lg min-w-[300px] max-w-sm pointer-events-auto transition-all duration-300 transform",
        styles[type],
        isExiting
          ? "opacity-0 translate-x-full"
          : "opacity-100 translate-x-0 animate-in slide-in-from-right-full",
      )}
      role="alert"
    >
      <div className="shrink-0">{icons[type]}</div>
      <p className="text-sm font-medium text-foreground flex-1">{message}</p>
      <button
        onClick={() => setIsExiting(true)}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
