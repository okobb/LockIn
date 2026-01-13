import type { CalendarBlock } from "../types/calendar";

export const WORK_START_HOUR = 9; // 9:00 AM
export const WORK_END_HOUR = 17; // 5:00 PM

/**
 * Checks if an end hour extends into overtime (past work hours)
 * @param endHour - The end hour as a decimal (e.g., 17.5 = 5:30 PM)
 */
export function isOvertime(endHour: number): boolean {
  return endHour > WORK_END_HOUR;
}

/**
 * Rounds a date's time to the nearest 15 minutes.
 * Useful for keeping block times clean when dragging.
 */
export function roundToNearest15Minutes(date: Date): Date {
  const minutes = date.getMinutes();
  const rounded = Math.round(minutes / 15) * 15;
  const newDate = new Date(date);
  newDate.setMinutes(rounded, 0, 0);
  return newDate;
}

export const TIME_SLOTS = [
  8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
];

export function formatTime(hour: number): string {
  const absoluteHour = Math.floor(hour);
  const minutes = Math.round((hour - absoluteHour) * 60);
  const suffix = absoluteHour >= 12 ? "PM" : "AM";
  const displayHour =
    absoluteHour > 12
      ? absoluteHour - 12
      : absoluteHour === 0
      ? 12
      : absoluteHour;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHour}:${displayMinutes} ${suffix}`;
}

export function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function calculateBlockStyle(
  startTime: string,
  endTime: string
): { height: string; top: string } {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

  // Only offset by minutes within the hour (blocks are already placed in their hour's slot)
  const startMinutes = start.getMinutes();

  // 1 minute = 1 pixel (based on SLOT_HEIGHT = 60px/hour)
  return {
    height: `${durationMinutes}px`,
    top: `${startMinutes}px`,
  };
}

export function checkBlocksOverlap(
  newStart: Date,
  newEnd: Date,
  existingBlocks: CalendarBlock[],
  excludeBlockId?: string
): boolean {
  return existingBlocks.some((block) => {
    if (excludeBlockId && block.id === excludeBlockId) return false;

    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);

    return newStart < blockEnd && newEnd > blockStart;
  });
}

/**
 * Formats the Date to preserve the local time with offset.
 * This ensures the backend interprets the time in the user's local context.
 */
export function formatDateWithOffset(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  // Get timezone offset in minutes and convert to ±HH:MM format
  const tzOffset = -date.getTimezoneOffset(); // Note: getTimezoneOffset returns opposite sign
  const tzSign = tzOffset >= 0 ? "+" : "-";
  const tzHours = pad(Math.floor(Math.abs(tzOffset) / 60));
  const tzMinutes = pad(Math.abs(tzOffset) % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${tzSign}${tzHours}:${tzMinutes}`;
}
