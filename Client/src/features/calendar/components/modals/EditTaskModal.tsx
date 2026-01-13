import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { BacklogTask } from "../../types/calendar";

export const EditTaskModal = ({
  isOpen,
  onClose,
  onConfirm,
  task,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    id: string,
    updates: {
      title: string;
      priority?: "urgent" | "high" | "medium" | "low";
      estimatedMinutes: number;
    }
  ) => void;
  task: BacklogTask | null;
}) => {
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

  if (!isOpen || !task) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Edit Task</h3>
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
            <label>Priority</label>
            <div className="type-options">
              {(["urgent", "high", "medium", "low"] as const).map((p) => (
                <button
                  key={p}
                  className={`type-option ${priority === p ? "active" : ""}`}
                  onClick={() => setPriority(p)}
                  style={{ textTransform: "capitalize" }}
                >
                  {p}
                </button>
              ))}
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
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
