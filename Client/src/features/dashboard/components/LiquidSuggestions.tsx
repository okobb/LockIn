import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../shared/components/UI/Card";
import { Button } from "../../../shared/components/UI/Button";
import { Sparkles, PlayCircle } from "lucide-react";
import { useReadLater } from "../../read-later/hooks/useReadLater";
import { Skeleton } from "../../../shared/components/Skeleton/Skeleton";
import type { ReadLaterItem } from "../../read-later/api/readLater";

export const LiquidSuggestions = () => {
  const { suggestions, isLoadingSuggestions, startItem } = useReadLater();

  if (isLoadingSuggestions) {
    return <LiquidSuggestionsSkeleton />;
  }

  if (!suggestions || suggestions.length === 0) {
    return null; 
  }

  const topSuggestion = suggestions[0]; 

  return (
    <Card className="bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
          <CardTitle className="text-lg text-indigo-900 dark:text-indigo-100">
            Open Slot found: {topSuggestion.gap.start} - {topSuggestion.gap.end}
          </CardTitle>
        </div>
        <CardDescription>
          {topSuggestion.gap.description} ({topSuggestion.gap.duration_minutes}{" "}
          min). Here's something you can read:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {topSuggestion.items.slice(0, 2).map((item: ReadLaterItem) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-900/50 rounded-lg border border-indigo-100 dark:border-indigo-900/50 shadow-sm"
          >
            <div className="flex-1 min-w-0 mr-3">
              <h4
                className="text-sm font-medium truncate"
                title={item.resource.title}
              >
                {item.resource.title}
              </h4>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {item.estimated_minutes ??
                  item.resource.estimated_time_minutes ??
                  "?"}{" "}
                min • {item.resource.type}
              </p>
            </div>

            <Button
              size="sm"
              variant="secondary"
              className="shrink-0"
              onClick={() => {
                window.open(item.resource.url, "_blank");
                startItem(item.id);
              }}
            >
              <PlayCircle className="h-3.5 w-3.5 mr-1.5" />
              Start
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const LiquidSuggestionsSkeleton = () => (
  <Card className="border-dashed">
    <CardHeader>
      <Skeleton className="h-6 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-16 w-full rounded-lg" />
    </CardContent>
  </Card>
);
