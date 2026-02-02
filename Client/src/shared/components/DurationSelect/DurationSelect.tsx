import { cn } from "../../lib/utils";

function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

interface DurationSelectProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  options?: number[];
}

const DEFAULT_OPTIONS = [15, 30, 45, 60, 90, 120, 150, 180, 240, 300, 480];

export const DurationSelect = ({
  value,
  onChange,
  className,
  options = DEFAULT_OPTIONS,
}: DurationSelectProps) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {options.map((minutes) => (
        <option key={minutes} value={minutes}>
          {minutes < 60 ? `${minutes} min` : formatMinutesToHours(minutes)}
        </option>
      ))}

      {!options.includes(value) && (
        <option value={value}>{formatMinutesToHours(value)}</option>
      )}
    </select>
  );
};
