export interface BacklogTask {
  id: string;
  title: string;
  priority?: "high" | "low" | "urgent" | "medium" | undefined;
  estimatedMinutes: number;
  tags?: string[];
}

export interface CalendarBlock {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  type: "deep_work" | "meeting" | "external";
}

export interface CapacityStats {
  deepWorkMinutes: number;
  meetingMinutes: number;
  externalMinutes: number;
  availableMinutes: number;
  targetMet: boolean;
}
