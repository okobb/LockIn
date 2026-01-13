import { useState, useEffect } from "react";
import { X, Clock, AlertTriangle } from "lucide-react";
import {
  TIME_SLOTS,
  formatTime,
  formatMinutesToHours,
  WORK_END_HOUR,
} from "../../utils/domain";

// Default work end time from domain constants
const WORK_END_TIME = WORK_END_HOUR;

interface CreateBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    title: string,
    type: "deep_work" | "meeting" | "external",
    duration: number,
    date: Date,
    hour: number,
    isOvertime?: boolean
  ) => void;
  weekDays: { name: string; date: Date; isToday: boolean }[];
  initialDate: Date | null;
  initialHour: number | null;
  initialDuration?: number | null;
  workEndHour?: number;
}

/**
 * Checks if a block extends past work hours
 */
function blockExtendsToOvertime(
  startHour: number,
  durationMinutes: number,
  workEndHour: number
): boolean {
  const endHour = startHour + durationMinutes / 60;
  return endHour > workEndHour;
}

/**
 * Formats the end time for display
 */
function getEndTime(startHour: number, durationMinutes: number): string {
  const endHour = startHour + durationMinutes / 60;
  const hours = Math.floor(endHour);
  const minutes = Math.round((endHour - hours) * 60);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export const CreateBlockModal = ({
  isOpen,
  onClose,
  onConfirm,
  weekDays,
  initialDate,
  initialHour,
  initialDuration,
  workEndHour = WORK_END_TIME,
}: CreateBlockModalProps) => {
  const [title, setTitle] = useState("Deep Work");
  const [type, setType] = useState<"deep_work" | "meeting" | "external">(
    "deep_work"
  );
  const [duration, setDuration] = useState(90);
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [selectedHour, setSelectedHour] = useState(9); // Default 9 AM
  const [showOvertimeConfirm, setShowOvertimeConfirm] = useState(false);

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowOvertimeConfirm(false);

      if (initialDate) {
        setSelectedDateStr(initialDate.toISOString());
      } else if (weekDays.length > 0) {
        // Default to first day if nothing selected
        setSelectedDateStr(weekDays[0].date.toISOString());
      }

      if (initialHour !== null) {
        setSelectedHour(initialHour);
      } else {
        setSelectedHour(9);
      }

      if (initialDuration) {
        setDuration(initialDuration);
      } else {
        setDuration(90);
      }
    }
  }, [isOpen, initialDate, initialHour, initialDuration, weekDays]);

  // Check if block extends into overtime whenever time/duration changes
  const isOvertimeBlock = blockExtendsToOvertime(
    selectedHour,
    duration,
    workEndHour
  );
  const endTimeDisplay = getEndTime(selectedHour, duration);

  const handleSubmit = () => {
    if (!selectedDateStr) return;

    // If block extends into overtime and user hasn't confirmed, show confirmation
    if (isOvertimeBlock && !showOvertimeConfirm) {
      setShowOvertimeConfirm(true);
      return;
    }

    const date = new Date(selectedDateStr);
    onConfirm(title, type, duration, date, selectedHour, isOvertimeBlock);
  };

  const handleConfirmOvertime = () => {
    if (!selectedDateStr) return;
    const date = new Date(selectedDateStr);
    onConfirm(title, type, duration, date, selectedHour, true);
  };

  const handleAdjustTimes = () => {
    setShowOvertimeConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create New Block</h3>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Overtime Confirmation View */}
        {showOvertimeConfirm ? (
          <div className="modal-body">
            <div className="overtime-confirm-banner">
              <div className="overtime-confirm-icon">
                <AlertTriangle size={24} />
              </div>
              <div className="overtime-confirm-content">
                <h4 className="overtime-confirm-title">
                  Block extends past work hours
                </h4>
                <p className="overtime-confirm-text">
                  This block ends at <strong>{endTimeDisplay}</strong>, which is
                  after your work end time of{" "}
                  <strong>{formatTime(workEndHour)}</strong>.
                </p>
                <div className="overtime-confirm-block-preview">
                  <Clock size={14} />
                  <span>
                    {title} • {formatTime(selectedHour)} - {endTimeDisplay}
                  </span>
                </div>
              </div>
            </div>

            <div className="overtime-confirm-actions">
              <button className="btn btn-ghost" onClick={handleAdjustTimes}>
                Adjust Times
              </button>
              <button
                className="btn overtime-btn-lockin"
                onClick={handleConfirmOvertime}
              >
                Lock In Overtime
              </button>
            </div>
          </div>
        ) : (
          /* Regular Form View */
          <>
            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-control"
                  autoFocus
                />
              </div>

              <div
                className="form-row"
                style={{ display: "flex", gap: "var(--space-3)" }}
              >
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Day</label>
                  <select
                    className="form-control"
                    value={selectedDateStr}
                    onChange={(e) => setSelectedDateStr(e.target.value)}
                  >
                    {weekDays.map((day) => (
                      <option key={day.name} value={day.date.toISOString()}>
                        {day.name} {day.date.getDate()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ width: "100px" }}>
                  <label>Start Time</label>
                  <select
                    className="form-control"
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(Number(e.target.value))}
                  >
                    {TIME_SLOTS.map((hour) => (
                      <option key={hour} value={hour}>
                        {formatTime(hour)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Type</label>
                <div className="type-options">
                  <button
                    className={`type-option ${
                      type === "deep_work" ? "active" : ""
                    }`}
                    onClick={() => setType("deep_work")}
                  >
                    Deep Work
                  </button>
                  <button
                    className={`type-option ${
                      type === "meeting" ? "active" : ""
                    }`}
                    onClick={() => setType("meeting")}
                  >
                    Meeting
                  </button>
                  <button
                    className={`type-option ${
                      type === "external" ? "active" : ""
                    }`}
                    onClick={() => setType("external")}
                  >
                    External
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="form-control"
                >
                  <option value={30}>30 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={150}>2.5 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                  <option value={300}>5 hours</option>
                  <option value={480}>8 hours</option>

                  {/* Fallback option if custom duration is dragging */}
                  {![30, 60, 90, 120, 150, 180, 240, 300, 480].includes(
                    duration
                  ) && (
                    <option value={duration}>
                      {formatMinutesToHours(duration)}
                    </option>
                  )}
                </select>
              </div>

              {/* Overtime Warning Banner */}
              {isOvertimeBlock && (
                <div className="overtime-warning-banner">
                  <Clock size={14} />
                  <span>
                    Ends at {endTimeDisplay} (after {formatTime(workEndHour)})
                  </span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {isOvertimeBlock ? "Continue" : "Create Block"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
