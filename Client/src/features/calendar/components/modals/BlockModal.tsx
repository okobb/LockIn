import { useState, useEffect } from "react";
import {
  X,
  Clock,
  AlertTriangle,
  Trash2,
  ChevronDown,
  Check,
} from "lucide-react";
import { isSameDay } from "date-fns";
import {
  formatTime,
  WORK_END_HOUR,
  formatDateWithOffset,
} from "../../utils/domain";
import { Button } from "../../../../shared/components/UI/Button";
import { Input } from "../../../../shared/components/UI/Input";
import { Label } from "../../../../shared/components/UI/Label";
import { BlockTypeSelector } from "../../../../shared/components/BlockTypeSelector/BlockTypeSelector";
import { DurationSelect } from "../../../../shared/components/DurationSelect/DurationSelect";
import { useModal } from "../../../../shared/context/ModalContext";
import { cn } from "../../../../shared/lib/utils";
import type { CalendarBlock } from "../../types/calendar";

// Default work end time from domain constants
const WORK_END_TIME = WORK_END_HOUR;

function blockExtendsToOvertime(
  startHour: number,
  durationMinutes: number,
  workEndHour: number,
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

export interface BlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  block?: CalendarBlock | null;

  onCreate?: (
    title: string,
    type: "deep_work" | "meeting" | "external",
    duration: number,
    date: Date,
    hour: number,
    isOvertime?: boolean,
  ) => void;
  initialDate?: Date | null;
  initialHour?: number | null;
  initialDuration?: number | null;
  weekDays?: { name: string; date: Date; isToday: boolean }[];
  workEndHour?: number;

  onUpdate?: (
    id: string,
    updates: {
      title: string;
      type?: "deep_work" | "meeting" | "external";
      start_time?: string;
      end_time?: string;
    },
  ) => void;
  onDelete?: (id: string) => void;
}

export const BlockModal = ({
  isOpen,
  onClose,
  block,
  onCreate,
  initialDate,
  initialHour,
  initialDuration,
  weekDays = [],
  workEndHour = WORK_END_TIME,
  onUpdate,
  onDelete,
}: BlockModalProps) => {
  const isEditMode = !!block;
  const { confirm } = useModal();

  const [title, setTitle] = useState("Deep Work");
  const [type, setType] = useState<"deep_work" | "meeting" | "external">(
    "deep_work",
  );
  const [duration, setDuration] = useState(90);

  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [selectedHour, setSelectedHour] = useState(9);
  const [showOvertimeConfirm, setShowOvertimeConfirm] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && block) {
      setTitle(block.title);
      setType(block.type ?? "external");

      const start = new Date(block.start_time);
      const end = new Date(block.end_time);
      const durationMin = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60),
      );
      setDuration(durationMin);

      const matchedDay = weekDays.find((d) => isSameDay(d.date, start));
      if (matchedDay) {
        setSelectedDateStr(matchedDay.date.toISOString());
      } else {
        setSelectedDateStr(start.toISOString());
      }

      const preciseHour = start.getHours() + start.getMinutes() / 60;
      const roundedHour = Math.round(preciseHour * 2) / 2;
      setSelectedHour(roundedHour);

      setShowOvertimeConfirm(false);
    } else {
      setTitle("Deep Work");
      setType("deep_work");
      if (initialDuration) setDuration(initialDuration);
      else setDuration(90);

      setShowOvertimeConfirm(false);

      if (initialDate) {
        setSelectedDateStr(initialDate.toISOString());
      } else if (weekDays.length > 0) {
        setSelectedDateStr(weekDays[0].date.toISOString());
      }

      if (initialHour !== null && initialHour !== undefined) {
        setSelectedHour(Math.round(initialHour * 2) / 2);
      } else {
        setSelectedHour(9);
      }
    }
  }, [
    isOpen,
    isEditMode,
    block,
    initialDate,
    initialHour,
    initialDuration,
    weekDays,
  ]);

  const isOvertimeBlock = blockExtendsToOvertime(
    selectedHour,
    duration,
    workEndHour,
  );
  const endTimeDisplay = getEndTime(selectedHour, duration);

  const timeSlots: number[] = [];
  for (let h = 5; h <= 21.5; h += 0.5) timeSlots.push(h);

  const handleCreateSubmit = () => {
    if (!onCreate || !selectedDateStr) return;

    if (isOvertimeBlock && !showOvertimeConfirm) {
      setShowOvertimeConfirm(true);
      return;
    }

    const date = new Date(selectedDateStr);
    onCreate(title, type, duration, date, selectedHour, isOvertimeBlock);
    onClose();
  };

  const handleConfirmOvertime = () => {
    if (!onCreate || !selectedDateStr) return;
    const date = new Date(selectedDateStr);
    onCreate(title, type, duration, date, selectedHour, true);
    onClose();
  };

  const handleUpdateSubmit = () => {
    if (!onUpdate || !block || !selectedDateStr) return;

    const newStart = new Date(selectedDateStr);
    const hours = Math.floor(selectedHour);
    const minutes = Math.round((selectedHour - hours) * 60);
    newStart.setHours(hours, minutes, 0, 0);

    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);

    onUpdate(block.id, {
      title,
      type,
      start_time: formatDateWithOffset(newStart),
      end_time: formatDateWithOffset(newEnd),
    });
    onClose();
  };

  const handleDelete = async () => {
    if (!onDelete || !block) return;
    if (
      await confirm(
        "Delete Block",
        "Are you sure you want to delete this block?",
      )
    ) {
      onDelete(block.id);
      onClose();
    }
  };

  const handleSubmit = isEditMode ? handleUpdateSubmit : handleCreateSubmit;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl w-full max-w-[400px] shadow-2xl flex flex-col max-h-[70vh] overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
        <div className="flex-none flex justify-between items-center p-4 border-b border-border bg-card z-10">
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            {isEditMode ? "Edit Block" : "Create New Block"}
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

          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
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
                    <strong className="text-foreground">
                      {endTimeDisplay}
                    </strong>
                    , which is after your work end time of{" "}
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
                  onClick={() => setShowOvertimeConfirm(false)}
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
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  className="h-9"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Label>Day</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedDateStr}
                    onChange={(e) => setSelectedDateStr(e.target.value)}
                  >
                    {!selectedDateStr && <option value="">Select Day</option>}
                    {weekDays.map((day) => (
                      <option key={day.name} value={day.date.toISOString()}>
                        {day.name} {day.date.getDate()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-[120px] space-y-2">
                  <Label>Start Time</Label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTimeOpen(!isTimeOpen)}
                      className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {formatTime(selectedHour)}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                    {isTimeOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsTimeOpen(false)}
                        />
                        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 custom-scrollbar">
                          {timeSlots.map((hour) => (
                            <div
                              key={hour}
                              className={cn(
                                "relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
                                hour === selectedHour &&
                                  "bg-accent text-accent-foreground font-medium",
                              )}
                              onClick={() => {
                                setSelectedHour(hour);
                                setIsTimeOpen(false);
                              }}
                            >
                              {formatTime(hour)}
                              {hour === selectedHour && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <BlockTypeSelector value={type} onChange={setType} />
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <DurationSelect value={duration} onChange={setDuration} />
              </div>

              {!isEditMode && isOvertimeBlock && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500 text-sm">
                  <Clock size={14} />
                  <span>
                    Ends at {endTimeDisplay} (after {formatTime(workEndHour)})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {!showOvertimeConfirm && (
          <div className="flex-none flex justify-between items-center p-4 border-t border-border bg-card">
            {isEditMode ? (
              <Button
                variant="ghost"
                onClick={handleDelete}
                className="text-white hover:text-white bg-destructive hover:bg-destructive/90 h-9"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            ) : (
              <div></div> // Spacer
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} className="h-9">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="h-9">
                {isEditMode ? "Save Changes" : "Create Block"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
