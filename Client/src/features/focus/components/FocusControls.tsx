import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { Button } from "../../../shared/components/UI/Button";

interface FocusControlsProps {
  onBack: () => void;
  onEndSession: () => void;
}

export function FocusControls({ onBack, onEndSession }: FocusControlsProps) {
  return (
    <div className="pt-8 flex items-center justify-between border-t border-border/20">
      <Button
        variant="ghost"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground hover:bg-transparent px-0 hover:underline underline-offset-4"
      >
        <ChevronLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Button>

      <Button
        size="lg"
        className="h-12 rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 text-sm font-semibold bg-primary hover:bg-primary/90 transition-all active:scale-95"
        onClick={onEndSession}
      >
        <CheckCircle2 className="w-4 h-4 mr-2" /> End Session
      </Button>
    </div>
  );
}
