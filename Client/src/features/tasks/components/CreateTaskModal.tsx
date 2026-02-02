import { useState } from "react";
import { X, Clock } from "lucide-react";
import type { BacklogTask } from "../../calendar/types/calendar";
import { PrioritySelector } from "../../../shared/components/PrioritySelector/PrioritySelector";
import { DurationSelect } from "../../../shared/components/DurationSelect/DurationSelect";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (task: BacklogTask) => void;
}

export const CreateTaskModal = ({
  isOpen,
  onClose,
  onConfirm,
}: CreateTaskModalProps) => {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<
    "urgent" | "high" | "medium" | "low"
  >("medium");
  const [duration, setDuration] = useState(60);
  const [tags, setTags] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;

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

    onConfirm(newTask);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle("");
    setPriority("medium");
    setDuration(60);
    setTags("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold tracking-tight">
            Create New Task
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Priority</label>
            <PrioritySelector value={priority} onChange={setPriority} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Duration
              </label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <DurationSelect
                  value={duration}
                  onChange={setDuration}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma separated"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-6 pt-0">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
};
