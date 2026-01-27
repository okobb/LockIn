import { Button } from "../../../shared/components/UI/Button";
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from "../../../shared/components/UI/Dropdown";
import { Clock, PlusCircle, Coffee, Bus, Moon } from "lucide-react";
import { useReadLater } from "../hooks/useReadLater";
import { useToast } from "../../../shared/context/ToastContext";

interface AddReadLaterButtonProps {
  resourceId: number;
  className?: string;
}

export const AddReadLaterButton = ({
  resourceId,
  className,
}: AddReadLaterButtonProps) => {
  const { addToQueue, isAdding } = useReadLater();
  const { toast } = useToast();

  const handleAdd = (gapType?: string, minutes?: number) => {
    addToQueue(
      {
        resource_id: resourceId,
        gap_type: gapType,
        estimated_minutes: minutes,
      },
      {
        onSuccess: () => toast("success", "Added to Read Later queue"),
        onError: () => toast("error", "Failed to add to queue"),
      },
    );
  };

  return (
    <Dropdown
      trigger={
        <Button
          variant="ghost"
          size="sm"
          className={className}
          disabled={isAdding}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Read Later
        </Button>
      }
    >
      <DropdownLabel>Add to Queue</DropdownLabel>
      <DropdownSeparator />

      <DropdownItem onClick={() => handleAdd()}>
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          General Queue
        </div>
      </DropdownItem>

      <DropdownSeparator />
      <DropdownLabel>Quick Tag</DropdownLabel>

      <DropdownItem onClick={() => handleAdd("15min_break", 15)}>
        <div className="flex items-center">
          <Coffee className="mr-2 h-4 w-4 text-amber-600" />
          15min Break
        </div>
      </DropdownItem>
      <DropdownItem onClick={() => handleAdd("commute", 30)}>
        <div className="flex items-center">
          <Bus className="mr-2 h-4 w-4 text-blue-500" />
          Commute (30m)
        </div>
      </DropdownItem>
      <DropdownItem onClick={() => handleAdd("evening", 60)}>
        <div className="flex items-center">
          <Moon className="mr-2 h-4 w-4 text-indigo-500" />
          Evening Deep Read
        </div>
      </DropdownItem>
    </Dropdown>
  );
};
