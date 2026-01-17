import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import type { CalendarBlock } from "../../types/calendar";
import { formatDateWithOffset } from "../../utils/domain";
import { cn } from "../../../../shared/lib/utils";
import { Button } from "../../../../shared/components/UI/Button";
import { Input } from "../../../../shared/components/UI/Input";
import { Label } from "../../../../shared/components/UI/Label";

interface EditBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    id: string,
    updates: {
      title: string;
      type?: "deep_work" | "meeting" | "external";
      end_time?: string;
    }
  ) => void;
  onDelete: (id: string) => void;
  block: CalendarBlock | null;
}

export const EditBlockModal = ({
  isOpen,
  onClose,
  onConfirm,
  onDelete,
  block,
}: EditBlockModalProps) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"deep_work" | "meeting" | "external">(
    "deep_work"
  );
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    if (isOpen && block) {
      setTitle(block.title);
      setType(block.type ?? "external");

      const start = new Date(block.start_time);
      const end = new Date(block.end_time);
      const durationMin = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60)
      );
      setDuration(durationMin);
    }
  }, [isOpen, block]);

  const handleSubmit = () => {
    if (!block) return;

    // Calculate new end time based on duration
    const start = new Date(block.start_time);
    const newEnd = new Date(start.getTime() + duration * 60 * 1000);

    onConfirm(block.id, {
      title,
      type,
      end_time: formatDateWithOffset(newEnd),
    });
    onClose();
  };

  const handleDelete = () => {
    if (!block) return;
    if (confirm("Are you sure you want to delete this block?")) {
      onDelete(block.id);
      onClose();
    }
  };

  if (!isOpen || !block) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-1000 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-lg w-full max-w-[400px] shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Edit Block</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>

        <div className="p-4 space-y-4">
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
            <Label>Type</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={type === "deep_work" ? "default" : "outline"}
                className={cn(
                  "w-full",
                  type === "deep_work" && "bg-primary text-primary-foreground"
                )}
                onClick={() => setType("deep_work")}
              >
                Deep Work
              </Button>
              <Button
                type="button"
                variant={type === "meeting" ? "default" : "outline"}
                className={cn(
                  "w-full",
                  type === "meeting" && "bg-primary text-primary-foreground"
                )}
                onClick={() => setType("meeting")}
              >
                Meeting
              </Button>
              <Button
                type="button"
                variant={type === "external" ? "default" : "outline"}
                className={cn(
                  "w-full",
                  type === "external" && "bg-primary text-primary-foreground"
                )}
                onClick={() => setType("external")}
              >
                External
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
              <option value={240}>4 hours</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleDelete}
            className="text-white hover:text-white bg-destructive hover:bg-destructive/90"
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
          <div className="flex gap-2">
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
