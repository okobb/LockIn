import { useState, useEffect } from "react";
import { X, Clock, Trash2 } from "lucide-react";
import type { BacklogTask } from "../../calendar/types/calendar";
import { Button } from "../../../shared/components/UI/Button";
import { Input } from "../../../shared/components/UI/Input";
import { Label } from "../../../shared/components/UI/Label";
import { PrioritySelector } from "../../../shared/components/PrioritySelector/PrioritySelector";
import { DurationSelect } from "../../../shared/components/DurationSelect/DurationSelect";
import { useModal } from "../../../shared/context/ModalContext";

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;

  // Edit Mode: if provided
  task?: BacklogTask | null;

  // Handlers
  onCreate?: (task: BacklogTask) => void;
  onUpdate?: (
    id: string,
    updates: {
      title: string;
      priority?: "urgent" | "high" | "medium" | "low";
      estimatedMinutes: number;
    },
  ) => void;
  onDelete?: (id: string) => void;
}

export const TaskModal = ({
  isOpen,
  onClose,
  task,
  onCreate,
  onUpdate,
  onDelete,
}: TaskModalProps) => {
  const isEditMode = !!task;
  const { confirm } = useModal();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<
    "urgent" | "high" | "medium" | "low"
  >("medium");
  const [duration, setDuration] = useState(60);
  const [tags, setTags] = useState("");

  // Initialize state
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && task) {
      setTitle(task.title);
      setPriority(task.priority || "medium");
      setDuration(task.estimatedMinutes);
      // Tags not currently in EditTaskModal but present in CreateTaskModal
      // If BacklogTask type has tags, we should probably support editing them too
      // But EditTaskModal didn't have them. I'll add them if task has them.
      setTags(task.tags ? task.tags.join(", ") : "");
    } else {
      setTitle("");
      setPriority("medium");
      setDuration(60);
      setTags("");
    }
  }, [isOpen, isEditMode, task]);

  const handleCreate = () => {
    if (!onCreate || !title.trim()) return;

    const newTask: BacklogTask = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      priority,
      estimatedMinutes: duration,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    onCreate(newTask);
    onClose();
  };

  const handleUpdate = () => {
    if (!onUpdate || !task) return;
    onUpdate(task.id, { title, priority, estimatedMinutes: duration });
    onClose();
  };

  const handleDelete = async () => {
    if (!onDelete || !task) return;
    if (
      await confirm("Delete Task", "Are you sure you want to delete this task?")
    ) {
      onDelete(task.id);
      onClose();
    }
  };

  const handleSubmit = isEditMode ? handleUpdate : handleCreate;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold tracking-tight">
            {isEditMode ? "Edit Task" : "Create New Task"}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={!isEditMode ? "What needs to be done?" : ""}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <PrioritySelector value={priority} onChange={setPriority} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <DurationSelect
                  value={duration}
                  onChange={setDuration}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Tags were only in Create, adding to both for consistency if we want */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma separated"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 pt-0">
          {isEditMode ? (
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          ) : (
            <div></div>
          )}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {isEditMode ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
