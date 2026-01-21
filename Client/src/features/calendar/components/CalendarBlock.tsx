import React, { memo } from "react";
import type { CalendarBlock as CalendarBlockType } from "../types/calendar";
import { calculateBlockStyle } from "../utils/domain";
import { cn } from "../../../shared/lib/utils";
import { Trash2 } from "lucide-react";

interface CalendarBlockProps {
  block: CalendarBlockType;
  onDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    block: CalendarBlockType,
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

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.(block.id);
    };

    const blockType = (block.type ?? "deep_work").replace("_", "-");

    return (
      <div
        className={cn(
          "calendar-block group absolute inset-x-1 rounded-md px-2 py-1.5 cursor-grab overflow-hidden z-10 transition-all duration-200 border-l-[3px]",
          "hover:z-50! hover:scale-[1.02] hover:shadow-xl hover:ring-1 hover:ring-white/10",

          "backdrop-blur-md shadow-sm",

          // Block type backgrounds - using semantic colors from palette
          blockType === "deep-work" &&
            "bg-[hsl(217_91%_60%/0.5)] border-[hsl(217_91%_60%/0.6)] hover:bg-[hsl(217_91%_60%/0.6)]",
          blockType === "meeting" &&
            "bg-[hsl(0_84%_60%/0.5)] border-[hsl(0_84%_60%/0.6)] hover:bg-[hsl(0_84%_60%/0.6)]",
          blockType === "external" &&
            "bg-[hsl(38_92%_50%/0.5)] border-[hsl(38_92%_50%/0.6)] hover:bg-[hsl(38_92%_50%/0.6)]",

          // Priority borders - using semantic colors
          block.priority === "urgent" && "border-l-[hsl(0_84%_60%)]",
          block.priority === "high" && "border-l-[hsl(38_92%_50%)]",
          block.priority === "medium" && "border-l-[hsl(217_91%_60%)]",
          block.priority === "low" && "border-l-[hsl(240_5%_65%)]",
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
          <div className="min-w-0 flex-1">
            <div className="font-medium text-xs leading-tight line-clamp-2 tracking-tight text-foreground">
              {block.title}
            </div>
            {(block.priority || (block.tags && block.tags.length > 0)) && (
              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                {block.priority && (
                  <span
                    className={cn(
                      "text-[7px] px-1 py-0.5 rounded uppercase font-bold tracking-wider leading-none",
                      block.priority === "urgent" &&
                        "bg-[hsl(0_84%_60%/0.2)] text-[hsl(0_84%_60%)]",
                      block.priority === "high" &&
                        "bg-[hsl(38_92%_50%/0.2)] text-[hsl(38_92%_50%)]",
                      block.priority === "medium" &&
                        "bg-[hsl(217_91%_60%/0.2)] text-[hsl(217_91%_60%)]",
                      block.priority === "low" &&
                        "bg-[hsl(240_5%_65%/0.2)] text-[hsl(240_5%_65%)]",
                    )}
                  >
                    {block.priority}
                  </span>
                )}
                {block.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-[8px] px-1 rounded-sm bg-[hsl(217_91%_60%/0.15)] text-[hsl(217_91%_60%)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {onDelete && (
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-opacity shrink-0"
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
  },
);

CalendarBlock.displayName = "CalendarBlock";

export default CalendarBlock;
