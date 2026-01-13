import { Clock, AlertTriangle, X } from "lucide-react";
import type { PendingMoveState } from "../../hooks/useCalendarEvents";

interface MoveOvertimeModalProps {
  pendingMove: PendingMoveState;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Formats a date to time string (e.g., "5:30 PM")
 */
function formatTimeFromDate(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export const MoveOvertimeModal = ({
  pendingMove,
  onConfirm,
  onCancel,
}: MoveOvertimeModalProps) => {
  const startTime = formatTimeFromDate(pendingMove.newStart);
  const endTime = formatTimeFromDate(pendingMove.newEnd);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "420px" }}>
        <div className="modal-header">
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={20} style={{ color: "var(--warning)" }} />
            Block Extends Past Work Hours
          </h3>
          <button className="btn-close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="overtime-confirm-banner">
            <div className="overtime-confirm-icon">
              <Clock size={24} />
            </div>
            <div className="overtime-confirm-content">
              <p className="overtime-confirm-text">
                Moving <strong>"{pendingMove.blockTitle}"</strong> to this time
                slot will extend past 5:00 PM.
              </p>
              <div className="overtime-confirm-block-preview">
                <Clock size={14} />
                <span>
                  {startTime} - {endTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ gap: "12px" }}>
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel Move
          </button>
          <button className="btn overtime-btn-lockin" onClick={onConfirm}>
            Lock In Overtime
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveOvertimeModal;
