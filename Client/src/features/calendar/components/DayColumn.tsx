import {
  useMemo,
  useState,
  useRef,
  type DragEvent,
  type MouseEvent,
} from "react";
import { TIME_SLOTS, formatTime } from "../utils/domain";
import CalendarBlock from "./CalendarBlock";
import type { CalendarBlock as ICalendarBlock } from "../types/calendar";

interface DayInfo {
  name: string;
  date: Date;
  isToday: boolean;
}

interface DayColumnProps {
  day: DayInfo;
  dayIndex: number;
  events: ICalendarBlock[];
  isDragging: boolean;
  dropTarget: { day: number; hour: number } | null;
  draggedDuration?: number;
  onDrop: (
    e: DragEvent<HTMLDivElement>,
    dayIndex: number,
    hour: number
  ) => void;
  onDragOver: (
    e: DragEvent<HTMLDivElement>,
    dayIndex: number,
    hour: number
  ) => void;
  onDragLeave: () => void;
  onTimeSlotClick: (dayIndex: number, hour: number) => void;
  onBlockDragStart: (
    e: DragEvent<HTMLDivElement>,
    block: ICalendarBlock
  ) => void;
  onBlockClick: (block: ICalendarBlock) => void;
  onBlockDelete?: (blockId: string) => void;
  onRangeSelect: (
    date: Date,
    startHour: number,
    durationMinutes: number
  ) => void;
}

const SLOT_HEIGHT = 60; // pixels per hour slot
const HALF_SLOT_HEIGHT = 30; // pixels per half-hour

export const DayColumn = ({
  day,
  dayIndex,
  events,
  isDragging,
  dropTarget,
  draggedDuration = 60,
  onDrop,
  onDragOver,
  onDragLeave,
  onTimeSlotClick,
  onBlockDragStart,
  onBlockClick,
  onBlockDelete,
  onRangeSelect,
}: DayColumnProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag-to-Create State
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftStart, setDraftStart] = useState<number | null>(null);
  const [draftEnd, setDraftEnd] = useState<number | null>(null);

  const eventsByHour = useMemo(() => {
    const map = new Map<number, ICalendarBlock[]>();
    TIME_SLOTS.forEach((h) => map.set(h, []));

    events.forEach((event) => {
      const h = new Date(event.start_time).getHours();
      if (map.has(h)) map.get(h)?.push(event);
    });
    return map;
  }, [events]);

  // Calculate time (in decimal hours) from event Y position
  const getTimeFromEvent = (
    e: MouseEvent<HTMLDivElement> | DragEvent<HTMLDivElement>
  ): number => {
    if (!containerRef.current) return TIME_SLOTS[0];

    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const firstSlot = TIME_SLOTS[0];

    // Calculate hours from top (with 15-min precision)
    const rawHours = y / SLOT_HEIGHT;
    const quarterHours = Math.floor(rawHours * 4) / 4; // Snap to 15-min intervals

    return firstSlot + quarterHours;
  };

  // --- Drag to Create Handlers ---
  const resetDraft = () => {
    setIsDrafting(false);
    setDraftStart(null);
    setDraftEnd(null);
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    // Skip if clicking on a block (let it handle its own events)
    if ((e.target as HTMLElement).closest(".calendar-block")) return;

    const time = getTimeFromEvent(e);
    setIsDrafting(true);
    setDraftStart(time);
    setDraftEnd(time);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    if (isDrafting && draftStart !== null) {
      const time = getTimeFromEvent(e);
      setDraftEnd(time);
    }
  };

  const handleMouseUp = () => {
    if (isDrafting && draftStart !== null && draftEnd !== null) {
      const start = Math.min(draftStart, draftEnd);
      const end = Math.max(draftStart, draftEnd);
      // Duration: difference between start and end, with minimum of 30 minutes
      const durationHours = Math.max(end - start, 0.5);
      const durationMinutes = durationHours * 60;

      onRangeSelect(day.date, start, durationMinutes);
    }
    
    // Reset
    resetDraft();
  };

  const handleMouseLeave = () => {
    // Cancel draft if leaving the column to prevent stuck state
    resetDraft();
  };

  // Calculate Ghost Block position and height (for drag-to-create)
  const ghostBlockStyle = useMemo(() => {
    if (!isDrafting || draftStart === null || draftEnd === null) {
      return null;
    }
    const startTime = Math.min(draftStart, draftEnd);
    const endTime = Math.max(draftStart, draftEnd);
    const firstSlot = TIME_SLOTS[0];

    const topOffset = (startTime - firstSlot) * SLOT_HEIGHT;
    // Height: minimum 30 pixels (30 min), otherwise based on selection
    const height = Math.max(endTime - startTime, 0.5) * SLOT_HEIGHT;

    return {
      top: `${topOffset}px`,
      height: `${Math.max(height, HALF_SLOT_HEIGHT)}px`,
    };
  }, [isDrafting, draftStart, draftEnd]);

  // Calculate Drop Preview Style (for drag-and-drop of existing blocks/tasks)
  const dropPreviewStyle = useMemo(() => {
    // Only show if dragging, this column is the target, and we have a valid time
    if (!isDragging || dropTarget?.day !== dayIndex || !dropTarget) return null;

    const startHour = dropTarget.hour;
    const firstSlot = TIME_SLOTS[0];
    const topOffset = (startHour - firstSlot) * SLOT_HEIGHT;
    const height = (draggedDuration / 60) * SLOT_HEIGHT;

    return {
      top: `${topOffset}px`,
      height: `${height}px`,
      display: "flex",
    };
  }, [isDragging, dropTarget, dayIndex, draggedDuration]);

  return (
    <div className="day-column">

      <div className={`day-column-header ${day.isToday ? "today" : ""}`}>
        <div className="day-name">{day.name}</div>
        <div className="day-date">{day.date.getDate()}</div>
      </div>

      <div
        ref={containerRef}
        className="day-slots-container relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {ghostBlockStyle && (
          <div className="ghost-block" style={ghostBlockStyle} />
        )}

        {dropPreviewStyle && (
          <div className="ghost-block" style={dropPreviewStyle}>
            <span className="ghost-block-label">
              {formatTime(dropTarget!.hour)}
            </span>
          </div>
        )}

        {TIME_SLOTS.map((hour) => (
          <div
            key={hour}
            className={`time-slot ${day.isToday ? "today" : ""}`}
            onDragOver={(e) => onDragOver(e, dayIndex, getTimeFromEvent(e))}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, dayIndex, getTimeFromEvent(e))}
            onClick={() => onTimeSlotClick(dayIndex, hour)}
          >
            <div className="time-slot-content">
              {eventsByHour.get(hour)?.map((block) => (
                <CalendarBlock
                  key={block.id}
                  block={block}
                  onDragStart={onBlockDragStart}
                  onClick={onBlockClick}
                  onDelete={onBlockDelete}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DayColumn;
