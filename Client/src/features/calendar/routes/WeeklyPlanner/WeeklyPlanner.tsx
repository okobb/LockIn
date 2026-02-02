import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  RefreshCw,
} from "lucide-react";

import { ConnectModal } from "../../../settings/components/ConnectModal";
import { useModal } from "../../../../shared/context/ModalContext";
import { useToast } from "../../../../shared/context/ToastContext";
import { useWeeklyPlanner } from "../../hooks/useWeeklyPlanner";
import { useIntegrations } from "../../../settings/hooks/useIntegrations";
import { useAuthContext } from "../../../auth/context/AuthContext";
import { CALENDAR_END_HOUR } from "../../utils/domain";
import { cn } from "../../../../shared/lib/utils";
import { Button } from "../../../../shared/components/UI/Button";

import { PlannerSidebar } from "../../components/PlannerSidebar";
import { PlannerCalendar } from "../../components/PlannerCalendar";

export default function WeeklyPlanner() {
  const { user } = useAuthContext();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectService, setConnectService] = useState("");
  const modal = useModal();
  const { toast } = useToast();

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
    returnToBacklog,
    syncCalendar,
    isSyncing,
    removeBacklogTask: removeBacklogTaskHook,
  } = useWeeklyPlanner();

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
    block: any,
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

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300 font-sans selection:bg-primary/20">
      <PlannerSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        tasks={backlogTasks}
        onAddTask={addBacklogTask}
        onRemoveTask={removeBacklogTask}
        onTaskDragStart={handleTaskDragStart}
        onDragEnd={handleDragEnd}
        onDrop={handleBacklogDrop}
        isDragOver={isBacklogDragOver}
        setIsDragOver={setIsBacklogDragOver}
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
                    duration: 60,
                  });
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Block
              </Button>

              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await syncCalendar();
                    toast("success", "Calendar synced successfully");
                  } catch {
                    toast("error", "Failed to sync calendar");
                  }
                }}
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
              Target: {Math.round((user?.weekly_goal_min || 3000) / 60)}h+ Deep
              Work
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden p-4 gap-4 bg-muted/5">
          <PlannerCalendar
            weekDays={weekDays}
            events={events}
            dragState={dragState}
            dropTarget={dropTarget}
            onDayDrop={handleDayDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setDropTarget(null)}
            onBlockDragStart={handleBlockDragStart}
            createBlockState={createBlockState}
            setCreateBlockState={setCreateBlockState}
            confirmCreateBlock={confirmCreateBlock}
            closeCreateBlockModal={closeCreateBlockModal}
            pendingMoveState={pendingMoveState}
            confirmPendingMove={confirmPendingMove}
            cancelPendingMove={cancelPendingMove}
            updateCalendarBlock={updateCalendarBlock}
            removeBlock={removeBlock}
          />
        </div>

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

function LegendItem({
  color,
  label,
  hours,
}: {
  color: string;
  label: string;
  hours: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-3 h-3 rounded-sm ${color}`} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{hours}</span>
    </div>
  );
}
