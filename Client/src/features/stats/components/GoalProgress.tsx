import { useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Button } from "../../../shared/components/UI/Button";
import { Input } from "../../../shared/components/UI/Input";
import { Pencil, Check, X } from "lucide-react";
import { setWeeklyGoal } from "../api/statsApi";
import { useModal } from "../../../shared/context/ModalContext";

interface GoalProgressProps {
  currentMinutes: number;
  goalMinutes: number | null;
  percentage: number;
  onGoalUpdate: () => void;
}

export function GoalProgress({
  currentMinutes,
  goalMinutes,
  percentage,
  onGoalUpdate,
}: GoalProgressProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newGoal, setNewGoal] = useState<string>(
    goalMinutes ? (goalMinutes / 60).toString() : "15",
  ); // Default 15 hours
  const { open } = useModal();

  const handleSave = async () => {
    const hours = parseFloat(newGoal);
    if (isNaN(hours) || hours <= 0) {
      return;
    }

    const minutes = Math.round(hours * 60);

    try {
      await setWeeklyGoal({ target_minutes: minutes });
      onGoalUpdate();
      setIsEditing(false);
    } catch (error) {
      open({
        type: "error",
        title: "Error",
        message: "Failed to update goal.",
      });
    }
  };

  const formatHours = (minutes: number) => {
    return (minutes / 60).toFixed(1);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-32 h-32 mb-4 relative">
        <CircularProgressbar
          value={percentage}
          text={`${percentage}%`}
          styles={buildStyles({
            textSize: "1.5rem",
            pathColor: `var(--primary)`,
            textColor: "hsl(var(--foreground))",
            trailColor: "hsl(var(--secondary))",
            pathTransitionDuration: 1,
            strokeLinecap: "round",
          })}
        />
      </div>

      <div className="text-center w-full">
        {isEditing ? (
          <div className="flex items-center justify-center gap-2 mb-2">
            <Input
              type="number"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              className="w-20 text-center h-8"
              autoFocus
            />
            <span className="text-sm text-muted-foreground">hrs</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={handleSave}
            >
              <Check className="w-4 h-4 text-green-500" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setIsEditing(false)}
            >
              <X className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-1 group">
            <div className="text-2xl font-bold">
              {formatHours(currentMinutes)}
              <span className="text-sm text-muted-foreground font-normal ml-1">
                / {goalMinutes ? formatHours(goalMinutes) : "-"} hrs
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                setNewGoal(goalMinutes ? (goalMinutes / 60).toString() : "15");
                setIsEditing(true);
              }}
            >
              <Pencil className="w-3 h-3" />
            </Button>
          </div>
        )}
        <p className="text-sm text-muted-foreground">Weekly Deep Work Goal</p>
      </div>
    </div>
  );
}
