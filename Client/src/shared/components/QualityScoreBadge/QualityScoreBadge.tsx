import { Trophy } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "../UI/Badge";

interface QualityScoreBadgeProps {
  score: number;
  className?: string;
  showLabel?: boolean;
}

export const QualityScoreBadge = ({
  score,
  className,
  showLabel = true,
}: QualityScoreBadgeProps) => {
  // Determine tier color
  const getTierStyles = (score: number) => {
    if (score >= 80) {
      return "bg-yellow-500/15 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/25";
    }
    if (score >= 50) {
      return "bg-slate-500/15 text-slate-600 border-slate-500/20 hover:bg-slate-500/25";
    }
    return "bg-orange-500/15 text-orange-600 border-orange-500/20 hover:bg-orange-500/25";
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 transition-colors cursor-help",
        getTierStyles(score),
        className
      )}
      title={`Context Quality Score: ${score}/100\nBased on tabs, voice notes, and code context.`}
    >
      <Trophy className="w-3.5 h-3.5" />
      {showLabel && <span className="font-mono font-medium">{score}</span>}
    </Badge>
  );
};
