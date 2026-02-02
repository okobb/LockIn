import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
  Clock,
  GripVertical,
} from "lucide-react";
import { cn } from "../../../shared/lib/utils";
import { Button } from "../../../shared/components/UI/Button";
import { TaskInput } from "../../../shared/components/TaskInput";
import { TaskModal } from "../../tasks/components/TaskModal";
import type { BacklogTask } from "../types/calendar";

interface PlannerSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  tasks: BacklogTask[];
  onAddTask: (task: BacklogTask) => void;
  onRemoveTask: (taskId: string) => void;
  onTaskDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    task: BacklogTask,
  ) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragOver: boolean;
  setIsDragOver: (isOver: boolean) => void;
}

export function PlannerSidebar({
  isCollapsed,
  onToggleCollapse,
  tasks,
  onAddTask,
  onRemoveTask,
  onTaskDragStart,
  onDragEnd,
  onDrop,
  isDragOver,
  setIsDragOver,
}: PlannerSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "urgent" | "high" | "medium" | "low"
  >("all");
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (
        searchQuery &&
        !task.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, priorityFilter]);

  const handleQuickAdd = (data: { title: string }) => {
    onAddTask({
      id: `task-${Date.now()}`,
      title: data.title,
      priority: "medium",
      estimatedMinutes: 60,
    });
  };

  return (
    <div
      className={cn(
        "flex-none flex flex-col transition-all duration-300 z-20",
        "rounded-xl border border-border bg-card shadow-sm",
        isCollapsed ? "w-[60px] h-14 self-start" : "w-[320px] h-full",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        onDrop(e);
        setIsDragOver(false);
      }}
    >
      <div
        className={cn(
          "flex-none h-14 flex items-center justify-between px-4 transition-colors duration-200",
          !isCollapsed && "border-b border-border",
          isDragOver && "bg-primary/10 border-primary/30",
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">
              Backlog
            </span>
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-secondary text-[10px] font-bold">
              {tasks.length}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-muted-foreground hover:text-foreground",
            isCollapsed && "mx-auto",
          )}
          onClick={onToggleCollapse}
        >
          {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </Button>
      </div>

      {!isCollapsed && (
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
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => onTaskDragStart(e, task)}
                onDragEnd={onDragEnd}
                className={cn(
                  "group flex flex-col gap-2 p-3 bg-card border border-border rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all hover:shadow-md relative overflow-hidden",
                  task.priority === "urgent" && "border-l-4 border-l-red-500",
                  task.priority === "high" && "border-l-4 border-l-orange-500",
                  task.priority === "medium" && "border-l-4 border-l-blue-500",
                  task.priority === "low" && "border-l-4 border-l-slate-400",
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
                          {tag}
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
                      onRemoveTask(task.id);
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

            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-secondary/20 rounded-lg border border-dashed border-border/50">
                <p className="text-xs">Your backlog is simple.</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-secondary/20 rounded-lg border border-dashed border-border/50">
                <p className="text-xs">No tasks match your filters.</p>
              </div>
            ) : null}

            <div className="pt-2 flex gap-1">
              <div className="flex-1">
                <TaskInput
                  onAddTask={handleQuickAdd}
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

      {!isCollapsed && isDragOver && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-primary/30 rounded-xl z-50 flex items-center justify-center pointer-events-none">
          <span className="bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium text-primary shadow-sm border border-primary/20">
            Drop to Unschedule
          </span>
        </div>
      )}

      <TaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onCreate={(task) => {
          onAddTask(task);
          setIsCreateTaskModalOpen(false);
        }}
      />
    </div>
  );
}
