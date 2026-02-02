import { Button } from "../UI/Button";
import { cn } from "../../lib/utils";

export type BlockType = "deep_work" | "meeting" | "external";

interface BlockTypeSelectorProps {
  value: BlockType;
  onChange: (value: BlockType) => void;
  className?: string;
}

export const BlockTypeSelector = ({
  value,
  onChange,
  className,
}: BlockTypeSelectorProps) => {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      <Button
        type="button"
        variant={value === "deep_work" ? "default" : "outline"}
        className={cn(
          "w-full",
          value === "deep_work" && "bg-primary text-primary-foreground",
        )}
        onClick={() => onChange("deep_work")}
      >
        Deep Work
      </Button>
      <Button
        type="button"
        variant={value === "meeting" ? "default" : "outline"}
        className={cn(
          "w-full",
          value === "meeting" && "bg-primary text-primary-foreground",
        )}
        onClick={() => onChange("meeting")}
      >
        Meeting
      </Button>
      <Button
        type="button"
        variant={value === "external" ? "default" : "outline"}
        className={cn(
          "w-full",
          value === "external" && "bg-primary text-primary-foreground",
        )}
        onClick={() => onChange("external")}
      >
        External
      </Button>
    </div>
  );
};
