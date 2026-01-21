import { useState } from "react";
import { X, Clock } from "lucide-react";
import { cn } from "../../../shared/lib/utils";
import type { BacklogTask } from "../../calendar/types/calendar";

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
            <div className="flex gap-2">
              {(["urgent", "high", "medium", "low"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex-1 items-center justify-center rounded-md text-xs font-medium py-2 px-3 border transition-all capitalize",
                    priority === p
                      ? "ring-2 ring-primary border-primary/50 bg-primary/5"
                      : "border-input hover:bg-accent hover:text-accent-foreground",
                    p === "urgent" &&
                      priority === "urgent" &&
                      "text-red-500 bg-red-500/10 border-red-500/20 ring-red-500/30",
                    p === "high" &&
                      priority === "high" &&
                      "text-orange-500 bg-orange-500/10 border-orange-500/20 ring-orange-500/30",
                    p === "medium" &&
                      priority === "medium" &&
                      "text-blue-500 bg-blue-500/10 border-blue-500/20 ring-blue-500/30",
                    p === "low" &&
                      priority === "low" &&
                      "text-slate-500 bg-slate-500/10 border-slate-500/20 ring-slate-500/30",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Duration
              </label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 pl-9"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                </select>
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
