import React, { memo } from "react";
import type { CalendarBlock as CalendarBlockType } from "../types/calendar";
import { calculateBlockStyle } from "../utils/domain";
import { cn } from "../../../shared/lib/utils";
import { Trash2 } from "lucide-react";

interface CalendarBlockProps {
  block: CalendarBlockType;
  onDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    block: CalendarBlockType
  ) => void;
  onClick: (block: CalendarBlockType) => void;
  onDelete?: (blockId: string) => void;
  style?: React.CSSProperties;
}

const CalendarBlock = memo(
  ({
    block,
    onDragStart,
    onClick,
    onDelete,
    style: propStyle,
  }: CalendarBlockProps) => {
    const defaultStyle = calculateBlockStyle(block.start_time, block.end_time);
    const style = { ...defaultStyle, ...propStyle };

    const startTime = new Date(block.start_time);
    const endTime = new Date(block.end_time);
    const durationHours =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this block?")) {
        onDelete?.(block.id);
      }
    };

    const blockType = (block.type ?? "deep_work").replace("_", "-");

    return (
      <div
        className={cn(
          "calendar-block group absolute inset-x-1 rounded-md px-2 py-1.5 cursor-grab overflow-hidden z-10 transition-all duration-200",
          "hover:z-50! hover:scale-[1.02] hover:shadow-xl hover:ring-1 hover:ring-white/10",

          "backdrop-blur-md shadow-sm",

          blockType === "deep-work" &&
            "bg-primary/50 border-primary/50 hover:bg-primary/30",
          blockType === "meeting" &&
            "bg-pink-500/50 border-pink-500/50 hover:bg-pink-500/30",
          blockType === "external" &&
            "bg-amber-500/50 border-amber-500/50 hover:bg-amber-500/30"
        )}
        style={style}
        draggable
        onDragStart={(e) => onDragStart(e, block)}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onClick(block);
        }}
      >
        <div className="flex justify-between items-start gap-1">
          <div className="font-medium text-xs leading-tight truncate tracking-tight text-foreground">
            {block.title}
          </div>

          {onDelete && (
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-opacity"
            >
              <Trash2 size={10} className="text-white/70" />
            </button>
          )}
        </div>

        <div className="mt-0.5 text-[10px] font-mono text-muted-foreground leading-tight">
          {startTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>
      </div>
    );
  }
);

CalendarBlock.displayName = "CalendarBlock";

export default CalendarBlock;
