import { useState, useEffect } from "react";
import { X, Clock, AlertTriangle } from "lucide-react";
import {
  TIME_SLOTS,
  formatTime,
  formatMinutesToHours,
  WORK_END_HOUR,
} from "../../utils/domain";
import { cn } from "../../../../shared/lib/utils";
import { Button } from "../../../../shared/components/UI/Button";
import { Input } from "../../../../shared/components/UI/Input";
import { Label } from "../../../../shared/components/UI/Label";

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

function blockExtendsToOvertime(
  startHour: number,
  durationMinutes: number,
  workEndHour: number
): boolean {
  const endHour = startHour + durationMinutes / 60;
  return endHour > workEndHour;
}

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-1000 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-lg w-full max-w-[400px] shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Create New Block
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>

        {showOvertimeConfirm ? (
          <div className="p-4">
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
              <div className="text-amber-500">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-amber-500 text-sm">
                  Block extends past work hours
                </h4>
                <p className="text-muted-foreground text-sm mt-1">
                  This block ends at{" "}
                  <strong className="text-foreground">{endTimeDisplay}</strong>,
                  which is after your work end time of{" "}
                  <strong className="text-foreground">
                    {formatTime(workEndHour)}
                  </strong>
                  .
                </p>
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground bg-background/50 px-3 py-2 rounded">
                  <Clock size={14} />
                  <span>
                    {title} • {formatTime(selectedHour)} - {endTimeDisplay}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleAdjustTimes}
                className="flex-1"
              >
                Adjust Times
              </Button>
              <Button
                onClick={handleConfirmOvertime}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Lock In Overtime
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Label>Day</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="w-[120px] space-y-2">
                  <Label>Start Time</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

              <div className="space-y-2">
                <Label>Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={type === "deep_work" ? "default" : "outline"}
                    className={cn(
                      "w-full",
                      type === "deep_work" &&
                        "bg-primary text-primary-foreground"
                    )}
                    onClick={() => setType("deep_work")}
                  >
                    Deep Work
                  </Button>
                  <Button
                    type="button"
                    variant={type === "meeting" ? "default" : "outline"}
                    className={cn(
                      "w-full",
                      type === "meeting" && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => setType("meeting")}
                  >
                    Meeting
                  </Button>
                  <Button
                    type="button"
                    variant={type === "external" ? "default" : "outline"}
                    className={cn(
                      "w-full",
                      type === "external" &&
                        "bg-primary text-primary-foreground"
                    )}
                    onClick={() => setType("external")}
                  >
                    External
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

              {isOvertimeBlock && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500 text-sm">
                  <Clock size={14} />
                  <span>
                    Ends at {endTimeDisplay} (after {formatTime(workEndHour)})
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {isOvertimeBlock ? "Continue" : "Create Block"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
