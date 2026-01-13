import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import type { CalendarBlock } from "../../types/calendar";
import { formatDateWithOffset } from "../../utils/domain";

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
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Edit Block</h3>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-control"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <div className="type-options">
              <button
                className={`type-option ${
                  type === "deep_work" ? "active" : ""
                }`}
                onClick={() => setType("deep_work")}
              >
                Deep Work
              </button>
              <button
                className={`type-option ${type === "meeting" ? "active" : ""}`}
                onClick={() => setType("meeting")}
              >
                Meeting
              </button>
              <button
                className={`type-option ${type === "external" ? "active" : ""}`}
                onClick={() => setType("external")}
              >
                External
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="form-control"
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
        <div
          className="modal-footer"
          style={{ justifyContent: "space-between" }}
        >
          <button
            className="btn btn-ghost"
            onClick={handleDelete}
            style={{ color: "var(--color-danger, #ef4444)" }}
          >
            <Trash2 size={16} />
            Delete
          </button>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
