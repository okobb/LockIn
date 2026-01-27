import { useReadLater } from "../../read-later/hooks/useReadLater";
import { Sparkles, Play } from "lucide-react";
import { Button } from "../../../shared/components/UI/Button";

import { useNavigate } from "react-router-dom";
import { useResourceMutations } from "../../resources/hooks/useResources";
import { useSessionContext } from "../../focus/context/SessionContext";

export const LiquidSuggestions = () => {
  const { suggestions, isLoadingSuggestions, startItem } = useReadLater();
  const navigate = useNavigate();
  const { addToSession } = useResourceMutations(); 
  const { activeSession } = useSessionContext();

  if (isLoadingSuggestions) {
    return <LiquidSuggestionsSkeleton />;
  }

  if (!suggestions || suggestions.length === 0 || !suggestions[0]) {
    return null;
  }

  const topSuggestion = suggestions[0];
  const items = topSuggestion.items;

  if (!items || items.length === 0) return null;
  const item = items[0];

  const handleStart = async () => {
    if (!item.resource.url) return;
    if (activeSession?.sessionId) {
      try {
        await addToSession.mutateAsync({
          sessionId: activeSession.sessionId,
          title: item.resource.title,
          url: item.resource.url,
        });
        navigate("/focus");
      } catch (e) {
        console.error("Failed to add to session", e);
      }
    } else {
      navigate("/focus", {
        state: {
          title: `Reading: ${item.resource.title}`,
          initialTabs: [{ title: item.resource.title, url: item.resource.url }],
          isNewSession: true,
        },
      });
    }

    startItem(item.id);
  };

  return (
    <div className="group/event relative pl-8 pb-4">
      <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-background bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse" />

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-amber-500 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            Open Slot:{" "}
            {topSuggestion.gap.start_iso
              ? new Date(topSuggestion.gap.start_iso).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : topSuggestion.gap.start}
            {" - "}
            {topSuggestion.gap.end_iso
              ? new Date(topSuggestion.gap.end_iso).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : topSuggestion.gap.end}
          </span>
          <span className="text-muted-foreground font-mono text-xs">
            ({topSuggestion.gap.duration_minutes} min free)
          </span>
        </div>

        <div className="bg-card/40 border border-border/50 rounded-xl p-3 hover:bg-card/60 transition-colors group/card relative overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {item.resource.title}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>{item.resource.estimated_time_minutes || 15} min</span>
                <span>•</span>
                <span className="capitalize">{item.resource.type}</span>
              </div>
            </div>

            <Button
              size="sm"
              className="h-8 px-3 text-xs bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground shadow-none border-0"
              onClick={handleStart}
            >
              <Play className="w-3 h-3 mr-1.5" />
              Start
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LiquidSuggestionsSkeleton = () => (
  <div className="relative pl-8 pb-4">
    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-background bg-muted" />
    <div className="space-y-2">
      <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
      <div className="h-12 w-full bg-muted/30 rounded-xl animate-pulse" />
    </div>
  </div>
);
