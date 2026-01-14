import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type DragEvent,
} from "react";
import { Link } from "react-router-dom";
import {
  CalendarRange,
  Plus,
  Upload,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Inbox,
  ChevronRight as ChevronRightIcon,
  GripVertical,
  Settings,
} from "lucide-react";
import Sidebar from "../../../../shared/components/Sidebar/Sidebar";
import { useWeeklyPlanner } from "../../hooks/useWeeklyPlanner";
import type { BacklogTask, CalendarBlock } from "../../types/calendar";
import { useIntegrations } from "../../../settings/hooks/useIntegrations";
import "./WeeklyPlanner.css";
import DayColumn from "../../components/DayColumn";
import { CreateBlockModal } from "../../components/modals/CreateBlockModal";
import { ConnectModal } from "../../../settings/components/ConnectModal";
import { EditTaskModal } from "../../../tasks/components/EditTaskModal";
import { EditBlockModal } from "../../components/modals/EditBlockModal";
import {
  TIME_SLOTS,
  formatTime,
  formatMinutesToHours,
  WORK_END_HOUR,
} from "../../utils/domain";
import { TaskInput } from "../../../../shared/components/TaskInput";
import { MoveOvertimeModal } from "../../components/modals/MoveOvertimeModal";

export default function WeeklyPlanner() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<BacklogTask | null>(null);
  const [editingBlock, setEditingBlock] = useState<CalendarBlock | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    day: number;
    hour: number;
  } | null>(null);

  const {
    weekLabel,
    weekDays,
    isLoading,
    isFetching,
    events,
    getEventsForDay,
    capacityStats,
    backlogTasks,
    isBacklogCollapsed,
    toggleBacklog,
    handleTaskDrop,
    handleAddBlock,
    handleGlobalAddBlock,
    moveBlock,
    removeBlock,
    returnToBacklog,
    addBacklogTask,
    updateBacklogTask,
    updateCalendarBlock,
    //isCreatingBlock,
    createBlockState,
    setCreateBlockState,
    confirmCreateBlock,
    closeCreateBlockModal,
    pendingMoveState,
    confirmPendingMove,
    cancelPendingMove,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    syncCalendar,
    isSyncing,
  } = useWeeklyPlanner();

  // Handler for adding tasks with overtime awareness
  const handleAddTask = useCallback(
    (data: { title: string; scheduled_date: string; is_overtime: boolean }) => {
      const newTask: BacklogTask = {
        id: `task-${Date.now()}`,
        title: data.title,
        estimatedMinutes: 30,
        priority: data.is_overtime ? "urgent" : "medium",
      };
      addBacklogTask(newTask);
      // TODO: In future, can use data.scheduled_date and data.is_overtime
      // to schedule task directly to calendar if needed
    },
    [addBacklogTask]
  );

  const { connect, isConnected, connectingKey } = useIntegrations();

  // Calculate the duration of whatever is being dragged
  const draggedDuration = useMemo(() => {
    if (draggedTaskId) {
      const task = backlogTasks.find((t) => t.id === draggedTaskId);
      return task ? task.estimatedMinutes : 30; // Default to 30 for tasks
    }
    if (draggedBlockId) {
      const block = events.find((b) => b.id === draggedBlockId);
      if (block) {
        const start = new Date(block.start_time);
        const end = new Date(block.end_time);
        return (end.getTime() - start.getTime()) / (1000 * 60); // duration in minutes
      }
    }
    return 60; // Fallback
  }, [draggedTaskId, draggedBlockId, backlogTasks, events]);

  // Keyboard shortcut for backlog toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "KeyB") {
        e.preventDefault();
        toggleBacklog();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleBacklog]);

  // Drag handlers
  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>, task: BacklogTask) => {
      setDraggedTaskId(task.id);
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({ type: "task", id: task.id })
      );
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleBlockDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>, block: CalendarBlock) => {
      setDraggedBlockId(block.id);
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({ type: "block", id: block.id })
      );
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setDraggedBlockId(null);
    setDropTarget(null);
  }, []);

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>, dayIndex: number, hour: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropTarget({ day: dayIndex, hour });
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, dayIndex: number, hour: number) => {
      e.preventDefault();

      const targetDate = weekDays[dayIndex]?.date;
      if (!targetDate) return;

      try {
        const data = JSON.parse(e.dataTransfer.getData("application/json"));

        if (data.type === "block") {
          moveBlock(data.id, targetDate, hour);
        } else if (data.type === "task") {
          handleTaskDrop(data.id, targetDate, hour);
        }
      } catch (err) {
        // Fallback for interactions where data might be just text (legacy/fallback)
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) {
          handleTaskDrop(taskId, targetDate, hour);
        }
      }

      setDraggedTaskId(null);
      setDraggedBlockId(null);
      setDropTarget(null);
    },
    [weekDays, handleTaskDrop, moveBlock]
  );

  const handleBacklogDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      try {
        const data = JSON.parse(e.dataTransfer.getData("application/json"));
        if (data.type === "block") {
          returnToBacklog(data.id);
        }
      } catch (err) {
        // Ignore invalid data
      }
      setDraggedTaskId(null);
      setDraggedBlockId(null);
    },
    [returnToBacklog]
  );

  const handleBacklogDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleImportCalendar = () => {
    console.log(
      "Import Calendar Clicked. Connected:",
      isGoogleCalendarConnected
    );
    if (isGoogleCalendarConnected) {
      console.log("Already connected, syncing...");
      syncCalendar();
    } else {
      console.log("Not connected, opening modal...");
      setIsConnectModalOpen(true);
    }
  };

  const handleConnectConfirm = () => {
    setIsConnectModalOpen(false);
    connect("google", "calendar");
  };

  const handleTimeSlotClick = useCallback(
    (dayIndex: number, hour: number) => {
      if (weekDays[dayIndex]) {
        handleAddBlock(weekDays[dayIndex].date, hour);
      }
    },
    [weekDays, handleAddBlock]
  );

  const handleRangeSelect = useCallback(
    (date: Date, startHour: number, durationMinutes: number) => {
      setCreateBlockState({
        isOpen: true,
        date: date,
        hour: startHour,
        duration: durationMinutes,
      } as any);
    },
    [setCreateBlockState]
  );

  const handleBlockClick = useCallback((block: CalendarBlock) => {
    setEditingBlock(block);
  }, []);

  const isGoogleCalendarConnected = isConnected("google", "calendar");

  return (
    <div className="planner-layout">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main
        className={`planner-content ${
          isSidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <header className="planner-header">
          <div>
            <h1 className="planner-title">
              Weekly Planner
              {isFetching && (
                <span className="fetching-indicator">
                  <CalendarRange size={16} />
                </span>
              )}
            </h1>
            <p className="planner-subtitle">
              Reserve Deep Work blocks and plan your week for maximum focus
            </p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={handleGlobalAddBlock}>
              <Plus size={16} />
              <span>Add Block</span>
            </button>
            <button
              className="btn btn-ghost"
              onClick={handleImportCalendar}
              disabled={isSyncing || connectingKey === "google-calendar"}
            >
              <Upload size={16} />
              <span>
                {isSyncing
                  ? "Syncing..."
                  : connectingKey === "google-calendar"
                  ? "Connecting..."
                  : isGoogleCalendarConnected
                  ? "Sync Calendar"
                  : "Import Calendar"}
              </span>
            </button>
            <Link to="/dashboard" className="btn btn-ghost">
              <ArrowRight size={16} />
              <span>View Today's Map</span>
            </Link>
          </div>
        </header>

        <div className="week-nav">
          <button
            className="week-nav-btn"
            onClick={goToPreviousWeek}
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="week-label">
            {weekLabel}
            {isFetching && <span className="fetching-indicator"> •</span>}
          </span>
          <button
            className="week-nav-btn"
            onClick={goToNextWeek}
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>
          <button className="btn btn-ghost" onClick={goToToday}>
            Today
          </button>
        </div>

        <div className="capacity-bar">
          <div className="capacity-item">
            <div className="capacity-icon deep-work" />
            <span className="capacity-label">Deep Work</span>
            <span className="capacity-value">
              {formatMinutesToHours(capacityStats.deepWorkMinutes)}
            </span>
          </div>
          <div className="capacity-item">
            <div className="capacity-icon meeting" />
            <span className="capacity-label">Meetings</span>
            <span className="capacity-value">
              {formatMinutesToHours(capacityStats.meetingMinutes)}
            </span>
          </div>
          <div className="capacity-item">
            <div className="capacity-icon external" />
            <span className="capacity-label">External</span>
            <span className="capacity-value">
              {formatMinutesToHours(capacityStats.externalMinutes)}
            </span>
          </div>
          <div className="capacity-item">
            <div className="capacity-icon available" />
            <span className="capacity-label">Available</span>
            <span className="capacity-value">
              {formatMinutesToHours(capacityStats.availableMinutes)}
            </span>
          </div>
          <div
            className={`capacity-target ${
              !capacityStats.targetMet ? "not-met" : ""
            }`}
          >
            {capacityStats.targetMet ? (
              <CheckCircle size={14} />
            ) : (
              <AlertCircle size={14} />
            )}
            <span>Target: 10h+ Deep Work</span>
          </div>
        </div>

        {/* Planner Wrapper */}
        <div className="planner-wrapper">
          <div
            className="planner-main card"
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              padding: 0,
              overflow: "hidden",
            }}
          >
            {isLoading ? (
              <div className="loading-overlay">Loading calendar...</div>
            ) : (
              <div
                className="flex flex-1 overflow-hidden h-full"
                style={{ display: "flex", flex: 1, overflow: "hidden" }}
              >
                <div className="time-col-wrapper">
                  <div className="time-col-header-spacer" />

                  <div
                    className="flex-1 overflow-hidden"
                    style={{ flex: 1, overflow: "hidden" }}
                  >
                    {TIME_SLOTS.map((hour) => (
                      <div key={hour} className="time-slot-label">
                        {formatTime(hour).split(" ")[0]}
                        <span>{formatTime(hour).split(" ")[1]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="day-columns-container">
                  {weekDays.map((day, index) => (
                    <DayColumn
                      key={day.name}
                      day={day}
                      dayIndex={index}
                      events={getEventsForDay(day.date)}
                      isDragging={!!(draggedTaskId || draggedBlockId)}
                      dropTarget={dropTarget}
                      draggedDuration={draggedDuration}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onTimeSlotClick={handleTimeSlotClick}
                      onBlockDragStart={handleBlockDragStart}
                      onBlockClick={handleBlockClick}
                      onBlockDelete={removeBlock}
                      onRangeSelect={handleRangeSelect}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside
            className={`backlog-panel ${
              isBacklogCollapsed ? "collapsed" : ""
            } ${draggedBlockId ? "ring-2 ring-primary ring-opacity-50" : ""}`}
            onDrop={handleBacklogDrop}
            onDragOver={handleBacklogDragOver}
          >
            <div className="backlog-panel-header">
              <div className="backlog-panel-title">
                <Inbox size={16} />
                <span>Backlog</span>
                <span className="backlog-panel-count">
                  {backlogTasks.length}
                </span>
              </div>
              <button
                className="backlog-toggle"
                onClick={toggleBacklog}
                title="Toggle backlog (B)"
                aria-label={
                  isBacklogCollapsed ? "Expand backlog" : "Collapse backlog"
                }
              >
                <ChevronRightIcon size={14} />
              </button>
            </div>

            <div className="backlog-panel-content">
              <p className="backlog-hint">
                <GripVertical size={12} />
                Drag tasks to schedule them
              </p>

              {backlogTasks.length === 0 ? (
                <div className="backlog-empty">
                  <p>All tasks scheduled! 🎉</p>
                </div>
              ) : (
                backlogTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`backlog-task group relative ${
                      draggedTaskId === task.id ? "dragging" : ""
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="backlog-task-header">
                      <div className="backlog-task-title">{task.title}</div>
                      <GripVertical size={14} className="drag-handle" />
                    </div>
                    <div className="backlog-task-meta">
                      {task.priority && (
                        <span className={`priority-tag ${task.priority}`}>
                          {task.priority}
                        </span>
                      )}
                      <span>
                        ~{formatMinutesToHours(task.estimatedMinutes)}
                      </span>
                    </div>
                    <button
                      className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 bg-transparent hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-all duration-150"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTask(task);
                      }}
                      title="Edit task"
                    >
                      <Settings size={14} />
                    </button>
                  </div>
                ))
              )}

              <TaskInput
                workEndTime={`${WORK_END_HOUR}:00`}
                onAddTask={handleAddTask}
                placeholder="Add a new task..."
              />
            </div>
          </aside>
        </div>
      </main>

      <CreateBlockModal
        isOpen={createBlockState.isOpen}
        onClose={closeCreateBlockModal}
        onConfirm={confirmCreateBlock}
        weekDays={weekDays}
        initialDate={createBlockState.date}
        initialHour={createBlockState.hour}
        initialDuration={createBlockState.duration}
      />

      <EditTaskModal
        isOpen={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onConfirm={updateBacklogTask}
      />

      <EditBlockModal
        isOpen={!!editingBlock}
        block={editingBlock}
        onClose={() => setEditingBlock(null)}
        onConfirm={updateCalendarBlock}
        onDelete={removeBlock}
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
        onConfirm={handleConnectConfirm}
        serviceName="Google Calendar"
      />
    </div>
  );
}
