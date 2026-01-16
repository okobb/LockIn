import {
  useMemo,
  useState,
  useRef,
  type DragEvent,
  type MouseEvent,
} from "react";
import {
  TIME_SLOTS,
  formatTime,
  SLOT_HEIGHT,
  HEADER_HEIGHT,
  CALENDAR_END_HOUR,
} from "../utils/domain";
import CalendarBlock from "./CalendarBlock";
import type { CalendarBlock as ICalendarBlock } from "../types/calendar";
import { cn } from "../../../shared/lib/utils";

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

// SLOT_HEIGHT imported from domain

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
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftStart, setDraftStart] = useState<number | null>(null);
  const [draftEnd, setDraftEnd] = useState<number | null>(null);

  const getTimeFromEvent = (e: MouseEvent | DragEvent): number => {
    if (!containerRef.current) return TIME_SLOTS[0];
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const firstSlot = TIME_SLOTS[0];
    const rawHours = y / SLOT_HEIGHT;
    const quarterHours = Math.floor(rawHours * 4) / 4;
    return firstSlot + quarterHours;
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    if ((e.target as HTMLElement).closest(".calendar-block")) return;
    const time = getTimeFromEvent(e);
    setIsDrafting(true);
    setDraftStart(time);
    setDraftEnd(time);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    if (isDrafting && draftStart !== null) {
      setDraftEnd(getTimeFromEvent(e));
    }
  };

  const handleMouseUp = () => {
    if (isDrafting && draftStart !== null && draftEnd !== null) {
      const start = Math.min(draftStart, draftEnd);
      const end = Math.max(draftStart, draftEnd);

      // Enforce 9 PM limit
      const validatedEnd = Math.min(end, CALENDAR_END_HOUR);

      const duration = Math.max(validatedEnd - start, 0.5) * 60;
      onRangeSelect(day.date, start, duration);
    }
    setIsDrafting(false);
    setDraftStart(null);
    setDraftEnd(null);
  };

  const ghostBlockStyle = useMemo(() => {
    if (!isDrafting || draftStart === null || draftEnd === null) return null;
    const start = Math.min(draftStart, draftEnd);
    const end = Math.max(draftStart, draftEnd);
    const firstSlot = TIME_SLOTS[0];
    return {
      top: `${(start - firstSlot) * SLOT_HEIGHT}px`,
      height: `${Math.max((end - start) * SLOT_HEIGHT, 30)}px`,
    };
  }, [isDrafting, draftStart, draftEnd]);

  const dropPreviewStyle = useMemo(() => {
    if (!isDragging || dropTarget?.day !== dayIndex || !dropTarget) return null;
    const firstSlot = TIME_SLOTS[0];
    return {
      top: `${(dropTarget.hour - firstSlot) * SLOT_HEIGHT}px`,
      height: `${(draggedDuration / 60) * SLOT_HEIGHT}px`,
    };
  }, [isDragging, dropTarget, dayIndex, draggedDuration]);

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const lastSlot = TIME_SLOTS[TIME_SLOTS.length - 1];
  const calendarEndTime = lastSlot + 1;

  const showCurrentTime =
    day.isToday &&
    currentHour >= TIME_SLOTS[0] &&
    currentHour < calendarEndTime;

  const currentTimeTop = (currentHour - TIME_SLOTS[0]) * SLOT_HEIGHT;

  return (
    <div className="flex-1 min-w-[160px] border-r border-border/40 last:border-r-0 flex flex-col group/column">
      <div
        className={cn(
          "flex flex-col justify-center items-center text-center sticky top-0 z-30 border-b border-border/40 transition-colors",
          day.isToday ? "bg-background border-b-primary/20" : "bg-background"
        )}
        style={{ height: HEADER_HEIGHT }}
      >
        <span
          className={cn(
            "text-sm font-medium",
            day.isToday ? "text-primary font-bold" : "text-foreground/90"
          )}
        >
          {day.name}{" "}
          <span className="text-xs opacity-75 font-normal ml-1">
            {day.date.getDate()}
          </span>
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, hsl(var(--border) / 0.5) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.2) 1px, transparent 1px)
          `,
          backgroundSize: `100% ${SLOT_HEIGHT}px, 100% ${SLOT_HEIGHT / 2}px`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDrafting(false);
          onDragLeave();
        }}
      >
        {showCurrentTime && (
          <div
            className="absolute w-full border-t-2 border-red-500 z-20 pointer-events-none opacity-90"
            style={{ top: `${currentTimeTop}px` }}
          >
            <div className="absolute -left-[4px] -top-[5px] w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          </div>
        )}

        {ghostBlockStyle && (
          <div
            className="absolute inset-x-1 bg-primary/20 border border-primary/40 rounded z-20 pointer-events-none"
            style={ghostBlockStyle}
          />
        )}

        {dropPreviewStyle && (
          <div
            className="absolute inset-x-1 bg-primary/20 border-2 border-dashed border-primary/50 rounded z-20 pointer-events-none flex items-center justify-center"
            style={dropPreviewStyle}
          >
            <span className="text-[10px] font-mono font-medium text-primary-foreground bg-primary px-1.5 rounded">
              {formatTime(dropTarget!.hour)}
            </span>
          </div>
        )}

        {TIME_SLOTS.map((hour) => (
          <div key={hour} className="contents">
            <div
              className="absolute w-full z-0 hover:bg-white/5 transition-colors border-b border-white/5"
              style={{
                height: `${SLOT_HEIGHT / 4}px`,
                top: `${(hour - TIME_SLOTS[0]) * SLOT_HEIGHT}px`,
              }}
              onDragOver={(e) => onDragOver(e, dayIndex, getTimeFromEvent(e))}
              onDrop={(e) => onDrop(e, dayIndex, getTimeFromEvent(e))}
              onClick={() => onTimeSlotClick(dayIndex, hour)}
            />
            <div
              className="absolute w-full z-0 hover:bg-white/5 transition-colors border-b border-white/5"
              style={{
                height: `${SLOT_HEIGHT / 4}px`,
                top: `${
                  (hour - TIME_SLOTS[0]) * SLOT_HEIGHT + SLOT_HEIGHT / 4
                }px`,
              }}
              onDragOver={(e) => onDragOver(e, dayIndex, getTimeFromEvent(e))}
              onDrop={(e) => onDrop(e, dayIndex, getTimeFromEvent(e))}
              onClick={() => onTimeSlotClick(dayIndex, hour + 0.25)}
            />
            <div
              className="absolute w-full z-0 hover:bg-white/5 transition-colors border-b border-white/5"
              style={{
                height: `${SLOT_HEIGHT / 4}px`,
                top: `${
                  (hour - TIME_SLOTS[0]) * SLOT_HEIGHT + (SLOT_HEIGHT / 4) * 2
                }px`,
              }}
              onDragOver={(e) => onDragOver(e, dayIndex, getTimeFromEvent(e))}
              onDrop={(e) => onDrop(e, dayIndex, getTimeFromEvent(e))}
              onClick={() => onTimeSlotClick(dayIndex, hour + 0.5)}
            />
            <div
              className="absolute w-full z-0 hover:bg-white/5 transition-colors"
              style={{
                height: `${SLOT_HEIGHT / 4}px`,
                top: `${
                  (hour - TIME_SLOTS[0]) * SLOT_HEIGHT + (SLOT_HEIGHT / 4) * 3
                }px`,
              }}
              onDragOver={(e) => onDragOver(e, dayIndex, getTimeFromEvent(e))}
              onDrop={(e) => onDrop(e, dayIndex, getTimeFromEvent(e))}
              onClick={() => onTimeSlotClick(dayIndex, hour + 0.75)}
            />
          </div>
        ))}

        {events.map((block) => {
          const start = new Date(block.start_time);
          const end = new Date(block.end_time);

          const startHour = start.getHours();
          const startMinutes = start.getMinutes();
          const durationMinutes = (end.getTime() - start.getTime()) / 60000;

          const hoursFromStart = startHour - TIME_SLOTS[0] + startMinutes / 60;
          const top = hoursFromStart * SLOT_HEIGHT;
          const height = durationMinutes * (SLOT_HEIGHT / 60);

          return (
            <CalendarBlock
              key={block.id}
              block={block}
              onDragStart={onBlockDragStart}
              onClick={onBlockClick}
              onDelete={onBlockDelete}
              style={{ top: `${top}px`, height: `${height}px` }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default DayColumn;
