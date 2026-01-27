import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap, Command, Plus } from "lucide-react";
import api from "../../../../shared/lib/axios";
import { cn } from "../../../../shared/lib/utils";

interface TaskSuggestion {
  id: number;
  title: string;
  number: number;
}

export default function MissionBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setError(null);
        const response = await api.get("/tasks/suggestions/list", {
          params: { query },
        });
        if (response.data.success) {
          setSuggestions(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions", error);
        setError("Failed to load suggestions");
        setSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNavigation = (value: string) => {
    if (!value.trim()) return;
    localStorage.removeItem("current_focus_session");

    const selectedTask = suggestions.find(
      (s) => s.title.toLowerCase() === value.toLowerCase(),
    );

    if (selectedTask) {
      navigate("/focus", {
        state: {
          taskId: selectedTask.id,
          title: selectedTask.title,
          isNewSession: true,
        },
      });
    } else {
      navigate("/focus", {
        state: { title: value, isFreestyle: true, isNewSession: true },
      });
    }
    setIsFocused(false);
    setSuggestions([]);
  };

  const selectSuggestion = (task: TaskSuggestion) => {
    setQuery(task.title);
    handleNavigation(task.title);
  };

  return (
    <div className="w-full" ref={containerRef}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative flex-1 flex items-center group transition-all duration-300 ease-out",
            "bg-card/90 backdrop-blur-sm border border-border/40 rounded-2xl shadow-sm",
            "hover:border-primary/30 hover:shadow-md hover:bg-card",
            isFocused &&
              "ring-2 ring-primary/50 border-primary shadow-[0_0_30px_hsl(var(--primary)/0.3)] bg-card",
          )}
        >
          <div className="pl-4 pr-3 text-primary/70 group-focus-within:text-primary transition-colors">
            <Zap className="w-5 h-5" strokeWidth={2.5} />
          </div>

          <input
            ref={inputRef}
            type="text"
            className="flex-1 h-12 md:h-14 border-none focus:outline-none focus:border-none focus:ring-offset-0 text-base md:text-lg text-foreground placeholder:text-muted-foreground/60 w-full bg-transparent outline-none ring-0 ring-offset-0 shadow-none focus:ring-0! focus-visible:ring-0! focus-visible:ring-offset-0!"
            placeholder="What are you working on?"
            value={query}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleNavigation(query);
              }
            }}
          />

          <div className="pr-2 flex items-center gap-1">
            <button
              onClick={() => handleNavigation(query)}
              className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              disabled={!query.trim()}
            >
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {isFocused && (suggestions.length > 0 || error) && (
            <div className="absolute top-full left-0 right-0 mt-2 p-1 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {error ? (
                  <div className="p-3 text-sm text-destructive text-center">
                    {error}
                  </div>
                ) : (
                  suggestions.map((task, index) => (
                    <button
                      key={task.id}
                      onClick={() => selectSuggestion(task)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                        "hover:bg-primary/10 hover:text-primary group/item",
                        index === 0 && "bg-accent/50",
                      )}
                    >
                      <div className="flex-none flex items-center justify-center w-8 h-8 rounded-md bg-background border border-border/50 text-muted-foreground text-xs group-hover/item:border-primary/20 group-hover/item:text-primary transition-colors">
                        <Command className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{task.title}</div>
                        <div className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
                          <span className="opacity-70">
                            Task #{task.number}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/context-save?mode=start")}
          className={cn(
            "flex-none h-12 md:h-14 w-12 md:w-14 flex items-center justify-center rounded-2xl transition-all duration-300",
            "bg-card/90 backdrop-blur-sm border border-border/40 shadow-sm",
            "hover:border-primary/50 hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:scale-105",
            "group/plus",
          )}
          title="Start New Context"
        >
          <Plus className="w-6 h-6 text-muted-foreground group-hover/plus:text-primary transition-colors" />
        </button>
      </div>
    </div>
  );
}
