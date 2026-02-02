import { useState } from "react";
import { isSameDay } from "date-fns";
import {
  TIME_SLOTS,
  formatTime,
  SLOT_HEIGHT,
  HEADER_HEIGHT,
} from "../utils/domain";
import { DayColumn } from "./DayColumn";
import { BlockModal } from "./modals/BlockModal";
import { MoveOvertimeModal } from "./modals/MoveOvertimeModal";
import type { CalendarBlock } from "../types/calendar";
import { useModal } from "../../../shared/context/ModalContext";
import { useToast } from "../../../shared/context/ToastContext";

interface PlannerCalendarProps {
  weekDays: { name: string; date: Date; isToday: boolean }[];
  events: CalendarBlock[];
  dragState: {
    isDragging: boolean;
    type: "task" | "block" | null;
    id: string | null;
    duration: number;
  };
  dropTarget: { day: number; hour: number } | null;
  onDayDrop: (
    e: React.DragEvent<HTMLDivElement>,
    dayIndex: number,
    hour: number,
  ) => void;
  onDragOver: (
    e: React.DragEvent<HTMLDivElement>,
    dayIndex: number,
    hour: number,
  ) => void;
  onDragLeave: () => void;
  onBlockDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    block: CalendarBlock,
  ) => void;

  // Modals & Actions
  createBlockState: {
    isOpen: boolean;
    date: Date | null;
    hour: number | null;
    duration?: number;
  };
  setCreateBlockState: (state: any) => void;
  confirmCreateBlock: (
    title: string,
    type: "deep_work" | "meeting" | "external",
    duration: number,
    date: Date,
    hour: number,
    isOvertime?: boolean,
  ) => void;
  closeCreateBlockModal: () => void;

  pendingMoveState: any;
  confirmPendingMove: () => void;
  cancelPendingMove: () => void;

  updateCalendarBlock: (id: string, updates: any) => void;
  removeBlock: (id: string) => void;
}

export function PlannerCalendar({
  weekDays,
  events,
  dragState,
  dropTarget,
  onDayDrop,
  onDragOver,
  onDragLeave,
  onBlockDragStart,
  createBlockState,
  setCreateBlockState,
  confirmCreateBlock,
  closeCreateBlockModal,
  pendingMoveState,
  confirmPendingMove,
  cancelPendingMove,
  updateCalendarBlock,
  removeBlock,
}: PlannerCalendarProps) {
  const modal = useModal();
  const { toast } = useToast();

  const [editBlockModalState, setEditBlockModalState] = useState<{
    isOpen: boolean;
    block: CalendarBlock | null;
  }>({
    isOpen: false,
    block: null,
  });

  const openEditModal = (block: CalendarBlock) => {
    setEditBlockModalState({ isOpen: true, block });
  };

  const closeEditModal = () => {
    setEditBlockModalState({ isOpen: false, block: null });
  };

  const onUpdateBlock = (id: string, updates: any) => {
    updateCalendarBlock(id, updates);
    closeEditModal();
  };

  const onDeleteBlock = async (id: string) => {
    const confirmed = await modal.open({
      type: "confirm",
      title: "Delete Block",
      message: "Are you sure you want to delete this block?",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (confirmed) {
      await removeBlock(id);
      closeEditModal();
      toast("success", "Block deleted successfully");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="flex-1 overflow-y-auto overflow-x-auto relative">
        <div className="flex min-w-[1000px] min-h-full">
          <div
            className="sticky left-0 z-40 w-14 flex flex-col border-r border-border/40 bg-background/95 backdrop-blur-sm"
            style={{ paddingTop: `${HEADER_HEIGHT}px` }}
          >
            {TIME_SLOTS.map((hour) => (
              <div
                key={hour}
                className="text-[10px] font-mono text-foreground/80 font-medium text-right pr-3 relative border-b border-transparent"
                style={{ height: `${SLOT_HEIGHT}px` }}
              >
                <span className="absolute top-0 right-3 -translate-y-1/2 bg-background px-1 z-10">
                  {formatTime(hour)}
                </span>
              </div>
            ))}
          </div>

          {weekDays.map((day, index) => (
            <DayColumn
              key={day.date.toISOString()}
              day={day}
              dayIndex={index}
              events={events.filter((e) =>
                isSameDay(new Date(e.start_time), day.date),
              )}
              isDragging={dragState.isDragging}
              dropTarget={dropTarget}
              draggedDuration={dragState.duration}
              onDrop={onDayDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onTimeSlotClick={(_, h) =>
                setCreateBlockState({
                  isOpen: true,
                  date: day.date,
                  hour: h,
                  duration: 60,
                })
              }
              onRangeSelect={(date, startHour, duration) => {
                setCreateBlockState({
                  isOpen: true,
                  date,
                  hour: startHour,
                  duration,
                });
              }}
              onBlockDragStart={onBlockDragStart}
              onBlockClick={openEditModal}
              onBlockDelete={onDeleteBlock}
            />
          ))}
        </div>
      </div>

      <BlockModal
        isOpen={createBlockState.isOpen}
        onClose={closeCreateBlockModal}
        onCreate={confirmCreateBlock}
        weekDays={weekDays}
        initialDate={createBlockState.date}
        initialHour={createBlockState.hour}
        initialDuration={createBlockState.duration}
      />

      <BlockModal
        isOpen={editBlockModalState.isOpen}
        onClose={closeEditModal}
        onUpdate={onUpdateBlock}
        onDelete={onDeleteBlock}
        block={editBlockModalState.block}
        weekDays={weekDays}
      />

      {pendingMoveState && (
        <MoveOvertimeModal
          pendingMove={pendingMoveState}
          onConfirm={confirmPendingMove}
          onCancel={cancelPendingMove}
        />
      )}
    </div>
  );
}
