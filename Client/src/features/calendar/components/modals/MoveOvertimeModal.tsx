import { Clock, AlertTriangle, X } from "lucide-react";
import type { PendingMoveState } from "../../hooks/useCalendarEvents";
import { Button } from "../../../../shared/components/UI/Button";

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-lg w-full max-w-[420px] shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <AlertTriangle size={20} className="text-amber-500" />
            Block Extends Past Work Hours
          </h3>
          <button
            className="bg-transparent border-0 text-muted-foreground cursor-pointer p-1 rounded hover:text-foreground hover:bg-secondary transition-colors"
            onClick={onCancel}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="text-amber-500">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                Moving{" "}
                <strong className="text-foreground">
                  "{pendingMove.blockTitle}"
                </strong>{" "}
                to this time slot will extend past 5:00 PM.
              </p>
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground bg-background/50 px-3 py-2 rounded">
                <Clock size={14} />
                <span>
                  {startTime} - {endTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-border">
          <Button variant="ghost" onClick={onCancel}>
            Cancel Move
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Lock In Overtime
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MoveOvertimeModal;
