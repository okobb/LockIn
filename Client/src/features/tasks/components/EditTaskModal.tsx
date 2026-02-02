import { useState, useEffect } from "react";
import { X, Clock, Trash2 } from "lucide-react";
import type { BacklogTask } from "../../calendar/types/calendar";
import { Button } from "../../../shared/components/UI/Button";
import { Input } from "../../../shared/components/UI/Input";
import { Label } from "../../../shared/components/UI/Label";
import { PrioritySelector } from "../../../shared/components/PrioritySelector/PrioritySelector";
import { DurationSelect } from "../../../shared/components/DurationSelect/DurationSelect";
import { useModal } from "../../../shared/context/ModalContext";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    id: string,
    updates: {
      title: string;
      priority?: "urgent" | "high" | "medium" | "low";
      estimatedMinutes: number;
    },
  ) => void;
  onDelete?: (id: string) => void;
  task: BacklogTask | null;
}

export const EditTaskModal = ({
  isOpen,
  onClose,
  onConfirm,
  onDelete,
  task,
}: EditTaskModalProps) => {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<
    "urgent" | "high" | "medium" | "low"
  >("medium");
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title);
      setPriority(task.priority || "medium");
      setDuration(task.estimatedMinutes);
    }
  }, [isOpen, task]);

  const handleSubmit = () => {
    if (!task) return;
    onConfirm(task.id, { title, priority, estimatedMinutes: duration });
    onClose();
  };

  const { confirm } = useModal();

  const handleDelete = async () => {
    if (!task || !onDelete) return;
    if (
      await confirm("Delete Task", "Are you sure you want to delete this task?")
    ) {
      onDelete(task.id);
      onClose();
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold tracking-tight">Edit Task</h3>
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
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <PrioritySelector value={priority} onChange={setPriority} />
          </div>

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
        </div>

        <div className="flex items-center justify-between p-6 pt-0">
          {onDelete && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          )}

          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
