import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Clock, Moon, Zap } from "lucide-react";

interface TaskAddData {
  title: string;
  scheduled_date: string;
  is_overtime: boolean;
}

interface TaskInputProps {
  workEndTime?: string;
  onAddTask: (data: TaskAddData) => void;
  placeholder?: string;
}

// Urgency keywords that bypass the overtime confirmation
const URGENCY_KEYWORDS = [
  "tonight",
  "urgent",
  "asap",
  "now",
  "emergency",
  "critical",
  "immediately",
  "right now",
];

/**
 * Parses a time string (HH:MM) and returns hours and minutes
 */
function parseTimeString(timeString: string): {
  hours: number;
  minutes: number;
} {
  const [hours, minutes] = timeString.split(":").map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
}

/**
 * Checks if the current time is after the specified work end time
 */
function isAfterWorkHours(workEndTime: string): boolean {
  const now = new Date();
  const { hours, minutes } = parseTimeString(workEndTime);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const endMinutes = hours * 60 + minutes;

  return currentMinutes >= endMinutes;
}

/**
 * Checks if the input text contains any urgency keywords
 */
function containsUrgencyKeyword(text: string): boolean {
  const lowerText = text.toLowerCase();
  return URGENCY_KEYWORDS.some((keyword) => lowerText.includes(keyword));
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

/**
 * Gets tomorrow's date in YYYY-MM-DD format
 */
function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

export function TaskInput({
  workEndTime = "17:00",
  onAddTask,
  placeholder = "Add a new task...",
}: TaskInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [pendingTask, setPendingTask] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowOvertimeModal(false);
        setPendingTask(null);
      }
    }

    if (showOvertimeModal) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showOvertimeModal]);

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && showOvertimeModal) {
        setShowOvertimeModal(false);
        setPendingTask(null);
        inputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showOvertimeModal]);

  const submitTask = useCallback(
    (title: string, date: string, isOvertime: boolean) => {
      onAddTask({
        title: title.trim(),
        scheduled_date: date,
        is_overtime: isOvertime,
      });
      setInputValue("");
      setShowOvertimeModal(false);
      setPendingTask(null);
    },
    [onAddTask]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const title = inputValue.trim();
      if (!title) return;

      if (isAfterWorkHours(workEndTime)) {
        if (containsUrgencyKeyword(title)) {
          // Bypass modal - submit immediately as overtime
          submitTask(title, getTodayDate(), true);
        } else {
          // Show confirmation modal
          setPendingTask(title);
          setShowOvertimeModal(true);
        }
      } else {
        // Before work end time - submit normally
        submitTask(title, getTodayDate(), false);
      }
    },
    [inputValue, workEndTime, submitTask]
  );

  const handleMoveToTomorrow = useCallback(() => {
    if (pendingTask) {
      submitTask(pendingTask, getTomorrowDate(), false);
    }
  }, [pendingTask, submitTask]);

  const handleLockInOvertime = useCallback(() => {
    if (pendingTask) {
      submitTask(pendingTask, getTodayDate(), true);
    }
  }, [pendingTask, submitTask]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setInputValue("");
        (e.target as HTMLInputElement).blur();
      }
    },
    []
  );

  return (
    <div className="task-input-container">
      <form onSubmit={handleSubmit} className="add-task-form">
        <div className="add-task-row">
          <Plus size={14} className="add-task-icon" />
          <input
            ref={inputRef}
            id="task-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="add-task-input"
            autoComplete="off"
          />
        </div>
        {inputValue && !showOvertimeModal && (
          <div className="add-task-hint">
            <span>
              Press <kbd className="key-hint">↵</kbd> to add
            </span>
            <span className="priority-hint">Medium Priority</span>
          </div>
        )}
      </form>

      {/* Overtime Confirmation Modal */}
      {showOvertimeModal && pendingTask && (
        <div ref={modalRef} className="overtime-modal">
          <div className="overtime-modal-header">
            <Clock size={16} className="overtime-modal-icon" />
            <span className="overtime-modal-title">
              It's after {workEndTime}
            </span>
          </div>
          <p className="overtime-modal-text">
            Your workday has ended. Would you like to move this task to tomorrow
            or lock in for overtime?
          </p>
          <div className="overtime-modal-task">"{pendingTask}"</div>
          <div className="overtime-modal-actions">
            <button
              type="button"
              onClick={handleMoveToTomorrow}
              className="overtime-btn overtime-btn-tomorrow"
            >
              <Moon size={14} />
              <span>Move to Tomorrow</span>
            </button>
            <button
              type="button"
              onClick={handleLockInOvertime}
              className="overtime-btn overtime-btn-lockin"
            >
              <Zap size={14} />
              <span>Lock In (Overtime)</span>
            </button>
          </div>
          <p className="overtime-modal-hint">
            <em>Tip: Add "urgent" or "asap" to bypass this prompt</em>
          </p>
        </div>
      )}
    </div>
  );
}

export default TaskInput;
