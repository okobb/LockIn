import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import api from "../../../../shared/lib/axios";
import "./MissionBar.css";

interface TaskSuggestion {
  id: number;
  title: string;
  number: number;
}

export default function MissionBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await api.get("/tasks/suggestions/list", {
          params: { query },
        });
        if (response.data.success) {
          setSuggestions(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions", error);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigation = (value: string) => {
    if (!value.trim()) return;

    const selectedTask = suggestions.find(
      (s) => s.title.toLowerCase() === value.toLowerCase()
    );

    if (selectedTask) {
      navigate("/focus", {
        state: { taskId: selectedTask.id, title: selectedTask.title },
      });
    } else {
      navigate("/focus", {
        state: { title: value, isFreestyle: true },
      });
    }
  };

  return (
    <div className="mission-bar-container">
      <div className="mission-bar active">
        <div className="mission-icon">
          <Zap size={18} className="icon-zap" />
        </div>
        <input
          type="text"
          className="mission-input"
          placeholder="What are you working on?"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            const prevLen = query.length;
            setQuery(val);

            const nativeEvent = e.nativeEvent as InputEvent;

            const matchesSuggestion = suggestions.some(
              (s) => s.title.toLowerCase() === val.toLowerCase()
            );

            if (!matchesSuggestion) return;

            const isReplacement =
              nativeEvent.inputType === "insertReplacementText";
            const isHeuristic =
              val.length - prevLen > 1 ||
              (nativeEvent.data === null && val.length > prevLen);

            if (isReplacement || isHeuristic) {
              handleNavigation(val);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleNavigation(query);
            }
          }}
          list="task-suggestions"
        />
        <datalist id="task-suggestions">
          {suggestions.map((task) => (
            <option key={task.id} value={task.title}>
              #{task.number}
            </option>
          ))}
        </datalist>
        <button
          className="mission-action-btn"
          onClick={() => handleNavigation(query)}
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
