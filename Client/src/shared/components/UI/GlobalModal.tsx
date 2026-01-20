import React, { useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Info,
  AlertCircle,
  HelpCircle,
  X,
  CheckCircle,
} from "lucide-react";
import type { ModalType } from "../../context/ModalContext";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

interface GlobalModalProps {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const iconMap: Record<ModalType, React.ReactNode> = {
  info: <Info size={24} />,
  success: <CheckCircle size={24} />,
  warning: <AlertTriangle size={24} />,
  error: <AlertCircle size={24} />,
  confirm: <HelpCircle size={24} />,
};

export function GlobalModal({
  isOpen,
  type,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onClose,
}: GlobalModalProps) {
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

  if (!isOpen) {
    return null;
  }

  const showCancelButton = type === "confirm";

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-100 animate-in fade-in duration-200 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground h-8 w-8"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={18} />
        </Button>

        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div
            className={cn("p-3 rounded-full mb-2", {
              "bg-blue-500/10 text-blue-500": type === "info",
              "bg-emerald-500/10 text-emerald-500": type === "success",
              "bg-amber-500/10 text-amber-500": type === "warning",
              "bg-red-500/10 text-red-500": type === "error",
              "bg-purple-500/10 text-purple-500": type === "confirm",
            })}
          >
            {iconMap[type]}
          </div>

          <h2
            id="modal-title"
            className="text-xl font-semibold tracking-tight text-foreground"
          >
            {title}
          </h2>
          <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-8">
          {showCancelButton && (
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              {cancelText}
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={onConfirm}
            variant={type === "error" ? "destructive" : "default"}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
