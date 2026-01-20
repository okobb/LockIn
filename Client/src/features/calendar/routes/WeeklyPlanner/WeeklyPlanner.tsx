import { useState, useMemo } from "react";
import { isSameDay } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  GripVertical,
  Clock,
  RefreshCw,
  Search,
  MoreVertical,
} from "lucide-react";

import Sidebar from "../../../../shared/components/Sidebar/Sidebar";
import { DayColumn } from "../../components/DayColumn";
import { CreateBlockModal } from "../../components/modals/CreateBlockModal";
import { CreateTaskModal } from "../../../tasks/components/CreateTaskModal";
import { EditBlockModal } from "../../components/modals/EditBlockModal";
import { MoveOvertimeModal } from "../../components/modals/MoveOvertimeModal";
import { ConnectModal } from "../../../settings/components/ConnectModal";
import { TaskInput } from "../../../../shared/components/TaskInput";
import { useModal } from "../../../../shared/context/ModalContext";
import { useWeeklyPlanner } from "../../hooks/useWeeklyPlanner";
import { useIntegrations } from "../../../settings/hooks/useIntegrations";
import {
  TIME_SLOTS,
  formatTime,
  SLOT_HEIGHT,
  HEADER_HEIGHT,
  CALENDAR_END_HOUR,
} from "../../utils/domain";
import { cn } from "../../../../shared/lib/utils";
import { Button } from "../../../../shared/components/UI/Button";
import type { CalendarBlock } from "../../types/calendar";

export default function WeeklyPlanner() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectService, setConnectService] = useState("");
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const modal = useModal();

  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "urgent" | "high" | "medium" | "low"
  >("all");

  const [editBlockModalState, setEditBlockModalState] = useState<{
    isOpen: boolean;
    block: CalendarBlock | null;
  }>({
    isOpen: false,
    block: null,
  });

  const {
    weekLabel,
    weekDays,
    goToNextWeek,
    goToPreviousWeek,
    goToToday,

    events,
    backlogTasks,
    addBacklogTask,
    capacityStats,

    createBlockState,
    confirmCreateBlock,
    closeCreateBlockModal,
    setCreateBlockState,

    pendingMoveState,
    confirmPendingMove,
    cancelPendingMove,

    updateCalendarBlock,
    removeBlock,
    moveBlock,
    handleTaskDrop,
    isBacklogCollapsed,
    toggleBacklog,
    returnToBacklog,
    syncCalendar,
    isSyncing,
    removeBacklogTask: removeBacklogTaskHook,
  } = useWeeklyPlanner();

  const filteredBacklogTasks = useMemo(() => {
    return backlogTasks.filter((task) => {
      // Search filter
      if (
        searchQuery &&
        !task.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [backlogTasks, searchQuery, priorityFilter]);

  const { isConnected, connect } = useIntegrations();

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    type: "task" | "block" | null;
    id: string | null;
    duration: number; // in minutes
  }>({
    isDragging: false,
    type: null,
    id: null,
    duration: 60,
  });

  const [isBacklogDragOver, setIsBacklogDragOver] = useState(false);

  const [dropTarget, setDropTarget] = useState<{
    day: number;
    hour: number;
  } | null>(null);

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
      removeBlock(id);
      closeEditModal();
    }
  };

  const handleConnect = (service: string) => {
    if (!isConnected("google", "calendar")) {
      setConnectService(service);
      setIsConnectModalOpen(true);
    }
  };

  const confirmConnect = () => {
    connect("google", "calendar");
    setIsConnectModalOpen(false);
  };

  const removeBacklogTask = async (taskId: string) => {
    const confirmed = await modal.open({
      type: "confirm",
      title: "Delete Task",
      message: "Are you sure you want to delete this task from the backlog?",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (confirmed) {
      removeBacklogTaskHook(taskId);
    }
  };

  const handleTaskDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    task: any,
  ) => {
    e.dataTransfer.setData("type", "task");
    e.dataTransfer.setData("id", task.id);
    e.dataTransfer.effectAllowed = "move";

    setDragState({
      isDragging: true,
      type: "task",
      id: task.id,
      duration: task.estimatedMinutes || 60,
    });
  };

  const handleBlockDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    block: CalendarBlock,
  ) => {
    e.dataTransfer.setData("type", "block");
    e.dataTransfer.setData("id", block.id);
    e.dataTransfer.setData("title", block.title);
    e.dataTransfer.effectAllowed = "move";

    const start = new Date(block.start_time);
    const end = new Date(block.end_time);
    const duration = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60),
    );

    setDragState({
      isDragging: true,
      type: "block",
      id: block.id,
      duration,
    });
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    dayIndex: number,
    hour: number,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Only update if changed to avoid renders
    if (dropTarget?.day !== dayIndex || dropTarget?.hour !== hour) {
      setDropTarget({ day: dayIndex, hour });
    }
  };

  const handleDayDrop = (
    e: React.DragEvent<HTMLDivElement>,
    dayIndex: number,
    hour: number,
  ) => {
    e.preventDefault();

    // Reset visual state
    setDragState({ isDragging: false, type: null, id: null, duration: 60 });
    setDropTarget(null);

    const type = e.dataTransfer.getData("type");
    const id = e.dataTransfer.getData("id");

    const date = weekDays[dayIndex].date;

    if (hour >= CALENDAR_END_HOUR) {
      modal.open({
        type: "error",
        title: "Schedule Conflict",
        message: "Cannot schedule tasks past 9 PM.",
      });
      return;
    }

    if (type === "task") {
      handleTaskDrop(id, date, hour);
    } else if (type === "block") {
      moveBlock(id, date, hour);
    }
  };

  const handleBacklogDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragState({ isDragging: false, type: null, id: null, duration: 60 });

    const type = e.dataTransfer.getData("type");
    const id = e.dataTransfer.getData("id");
    const title = e.dataTransfer.getData("title");

    if (type === "block" && id) {
      console.log("Dropping block back to backlog:", id, "title:", title);
      returnToBacklog(id, title);
    }
  };

  const handleDragEnd = () => {
    setDragState({ isDragging: false, type: null, id: null, duration: 60 });
    setDropTarget(null);
  };

  const LegendItem = ({
    color,
    label,
    hours,
  }: {
    color: string;
    label: string;
    hours: string;
  }) => (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-3 h-3 rounded-sm ${color}`} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{hours}</span>
    </div>
  );

  const handleAddTask = (data: {
    title: string;
    scheduled_date: string;
    is_overtime: boolean;
  }) => {
    addBacklogTask({
      id: `task-${Date.now()}`,
      title: data.title,
      priority: "medium",
      estimatedMinutes: 60,
    });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300 font-sans selection:bg-primary/20">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main
        className={cn(
          "flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300",
          isSidebarCollapsed ? "pl-[64px]" : "pl-[260px]",
        )}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-none flex flex-col z-10 border-b border-border bg-background">
          <div className="px-6 py-5 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">
                Weekly Planner
              </h1>
              <p className="text-sm text-muted-foreground">
                Reserve Deep Work blocks and plan your week for maximum focus
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  const now = new Date();
                  setCreateBlockState({
                    isOpen: true,
                    date: now,
                    hour: now.getHours() + 1,
                  });
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Block
              </Button>

              <Button
                variant="outline"
                onClick={syncCalendar}
                disabled={isSyncing}
                title="Sync with Google Calendar"
              >
                <RefreshCw
                  className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")}
                />
                {isSyncing ? "Syncing..." : "Sync"}
              </Button>

              <Button
                variant="outline"
                onClick={() => handleConnect("Google Calendar")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" /> Import Calendar
              </Button>
              <Button variant="ghost" onClick={goToToday}>
                View Today's Map
              </Button>
            </div>
          </div>

          <div className="px-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-transparent rounded-lg border border-border/40 p-0.5 overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-sm hover:bg-muted/50 rounded-r-none border-r border-border/40"
                  onClick={goToPreviousWeek}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm font-medium min-w-[150px] text-center bg-secondary/20 h-7 flex items-center justify-center">
                  {weekLabel}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-sm hover:bg-muted/50 rounded-l-none border-l border-border/40"
                  onClick={goToNextWeek}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs"
                onClick={goToToday}
              >
                Today
              </Button>
            </div>

            <div className="flex items-center gap-6 bg-card/50 px-4 py-2 rounded-lg border border-border/50">
              <LegendItem
                color="bg-primary"
                label="Deep Work"
                hours={`${Math.round(capacityStats.deepWorkMinutes / 60)}h`}
              />
              <LegendItem
                color="bg-purple-500"
                label="Meetings"
                hours={`${Math.round(capacityStats.meetingMinutes / 60)}h`}
              />
              <LegendItem
                color="bg-yellow-500"
                label="External"
                hours={`${Math.round(capacityStats.externalMinutes / 60)}h`}
              />
              <LegendItem
                color="bg-green-500"
                label="Available"
                hours={`${Math.round(capacityStats.availableMinutes / 60)}h`}
              />
            </div>

            <div className="hidden xl:flex items-center px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md text-xs font-medium">
              Target: 10h+ Deep Work
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden p-4 gap-4 bg-muted/5">
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
                    onDrop={handleDayDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={() => setDropTarget(null)}
                    onTimeSlotClick={(_, h) =>
                      setCreateBlockState({
                        isOpen: true,
                        date: day.date,
                        hour: h,
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
                    onBlockDragStart={handleBlockDragStart}
                    onBlockClick={openEditModal}
                    onBlockDelete={onDeleteBlock}
                  />
                ))}
              </div>
            </div>
          </div>

          <div
            className={cn(
              "flex-none flex flex-col transition-all duration-300 z-20",
              "rounded-xl border border-border bg-card shadow-sm",
              isBacklogCollapsed
                ? "w-[60px] h-14 self-start"
                : "w-[320px] h-full",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (!isBacklogDragOver) setIsBacklogDragOver(true);
            }}
            onDragLeave={() => setIsBacklogDragOver(false)}
            onDrop={(e) => {
              handleBacklogDrop(e);
              setIsBacklogDragOver(false);
            }}
          >
            <div
              className={cn(
                "flex-none h-14 flex items-center justify-between px-4 transition-colors duration-200",
                !isBacklogCollapsed && "border-b border-border",
                isBacklogDragOver && "bg-primary/10 border-primary/30",
              )}
            >
              {!isBacklogCollapsed && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tracking-tight">
                    Backlog
                  </span>
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-secondary text-[10px] font-bold">
                    {backlogTasks.length}
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 text-muted-foreground hover:text-foreground",
                  isBacklogCollapsed && "mx-auto",
                )}
                onClick={toggleBacklog}
              >
                {isBacklogCollapsed ? (
                  <ChevronLeft size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </Button>
            </div>

            {!isBacklogCollapsed && (
              <>
                <div className="flex-none p-3 space-y-2 border-b border-border/50 bg-muted/20">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                    {(["all", "urgent", "high", "medium", "low"] as const).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setPriorityFilter(p)}
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap border transition-all",
                            priorityFilter === p
                              ? "bg-primary text-primary-foreground border-primary font-medium"
                              : "bg-background text-muted-foreground border-border hover:border-primary/30",
                          )}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {filteredBacklogTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleTaskDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "group flex flex-col gap-2 p-3 bg-card border border-border rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all hover:shadow-md relative overflow-hidden",
                        task.priority === "urgent" &&
                          "border-l-4 border-l-red-500",
                        task.priority === "high" &&
                          "border-l-4 border-l-orange-500",
                        task.priority === "medium" &&
                          "border-l-4 border-l-blue-500",
                        task.priority === "low" &&
                          "border-l-4 border-l-slate-400",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium line-clamp-2 leading-snug">
                          {task.title}
                        </span>
                        <GripVertical className="text-muted-foreground w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {task.priority && (
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded border uppercase font-semibold tracking-wider",
                              task.priority === "urgent" &&
                                "bg-red-500/10 text-red-500 border-red-500/20",
                              task.priority === "high" &&
                                "bg-orange-500/10 text-orange-500 border-orange-500/20",
                              task.priority === "medium" &&
                                "bg-blue-500/10 text-blue-500 border-blue-500/20",
                              task.priority === "low" &&
                                "bg-slate-500/10 text-slate-500 border-slate-500/20",
                            )}
                          >
                            {task.priority}
                          </span>
                        )}

                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1">
                            {task.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded border border-border/50"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" /> ~
                          {Math.round(task.estimatedMinutes / 60)}h
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBacklogTask(task.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-destructive/70 hover:text-destructive rounded transition-all"
                          title="Delete Task"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {backlogTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-secondary/20 rounded-lg border border-dashed border-border/50">
                      <p className="text-xs">Your backlog is simple.</p>
                    </div>
                  ) : filteredBacklogTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-secondary/20 rounded-lg border border-dashed border-border/50">
                      <p className="text-xs">No tasks match your filters.</p>
                    </div>
                  ) : null}

                  <div className="pt-2 flex gap-1">
                    <div className="flex-1">
                      <TaskInput
                        onAddTask={handleAddTask}
                        placeholder="+ Add Task"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0 border-dashed"
                      onClick={() => setIsCreateTaskModalOpen(true)}
                      title="More options"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {!isBacklogCollapsed && isBacklogDragOver && (
              <div className="absolute inset-0 bg-primary/10 border-2 border-primary/30 rounded-xl z-50 flex items-center justify-center pointer-events-none">
                <span className="bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium text-primary shadow-sm border border-primary/20">
                  Drop to Unschedule
                </span>
              </div>
            )}
          </div>
        </div>

        <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          onConfirm={(task) => {
            addBacklogTask(task);
            setIsCreateTaskModalOpen(false);
          }}
        />

        <CreateBlockModal
          isOpen={createBlockState.isOpen}
          onClose={closeCreateBlockModal}
          onConfirm={confirmCreateBlock}
          weekDays={weekDays}
          initialDate={createBlockState.date}
          initialHour={createBlockState.hour}
          initialDuration={createBlockState.duration}
        />

        <EditBlockModal
          isOpen={editBlockModalState.isOpen}
          onClose={closeEditModal}
          onConfirm={onUpdateBlock}
          onDelete={onDeleteBlock}
          block={editBlockModalState.block}
        />

        {pendingMoveState && (
          <MoveOvertimeModal
            pendingMove={pendingMoveState}
            onConfirm={confirmPendingMove}
            onCancel={cancelPendingMove}
          />
        )}

        <ConnectModal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          onConfirm={confirmConnect}
          serviceName={connectService}
        />
      </main>
    </div>
  );
}
