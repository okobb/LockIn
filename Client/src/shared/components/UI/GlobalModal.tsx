import React, { useEffect, useCallback } from "react";
import { AlertTriangle, Info, AlertCircle, HelpCircle, X } from "lucide-react";
import type { ModalType } from "../../context/ModalContext";
import "./GlobalModal.css";

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
  warning: <AlertTriangle size={24} />,
  error: <AlertCircle size={24} />,
  confirm: <HelpCircle size={24} />,
};

const typeClasses: Record<ModalType, string> = {
  info: "modal-info",
  warning: "modal-warning",
  error: "modal-error",
  confirm: "modal-confirm",
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
    [onClose]
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
    [onClose]
  );

  if (!isOpen) {
    return null;
  }

  const showCancelButton = type === "confirm";

  return (
    <div
      className={`global-modal-backdrop ${isOpen ? "modal-open" : ""}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`global-modal ${typeClasses[type]}`}>
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className={`modal-icon ${typeClasses[type]}`}>{iconMap[type]}</div>

        <h2 id="modal-title" className="modal-title">
          {title}
        </h2>
        <p className="modal-message">{message}</p>

        <div className="modal-actions">
          {showCancelButton && (
            <button className="modal-btn modal-btn-cancel" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button className="modal-btn modal-btn-confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
