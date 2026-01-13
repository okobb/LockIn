import React, { memo } from "react";
import type { CalendarBlock as CalendarBlockType } from "../types/calendar";
import { calculateBlockStyle } from "../utils/domain";

interface CalendarBlockProps {
  block: CalendarBlockType;
  onDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    block: CalendarBlockType
  ) => void;
  onClick: (block: CalendarBlockType) => void;
  onDelete?: (blockId: string) => void;
}

const CalendarBlock = memo(
  ({ block, onDragStart, onClick, onDelete }: CalendarBlockProps) => {
    const style = calculateBlockStyle(block.start_time, block.end_time);

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

    return (
      <div
        className={`calendar-block ${(block.type ?? "deep_work").replace(
          "_",
          "-"
        )}`}
        style={style}
        draggable
        onDragStart={(e) => onDragStart(e, block)}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(block);
        }}
      >
        <div className="block-title">{block.title}</div>
        <div className="block-time">
          {startTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}{" "}
          -{" "}
          {endTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </div>
        {durationHours >= 1 && (
          <span className="block-badge">
            {Number.isInteger(durationHours)
              ? durationHours
              : durationHours.toFixed(1)}
            h
          </span>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="block-delete-btn"
            title="Delete Block"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              width="12"
              height="12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

CalendarBlock.displayName = "CalendarBlock";

export default CalendarBlock;
