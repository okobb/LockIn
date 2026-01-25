export interface BacklogTask {
  id: string;
  title: string;
  priority?: "high" | "low" | "urgent" | "medium";
  estimatedMinutes: number;
  tags?: string[];
  task_id?: number;
}

export interface CalendarBlock {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  type: "deep_work" | "meeting" | "external";
  priority?: "high" | "low" | "urgent" | "medium";
  tags?: string[];
  task_id?: number;
}

export interface CapacityStats {
  deepWorkMinutes: number;
  meetingMinutes: number;
  externalMinutes: number;
  availableMinutes: number;
  targetMet: boolean;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  type: "deep_work" | "meeting" | "external";
  source: "manual" | "google_calendar";
  external_id: string | null;
  priority?: "high" | "low" | "urgent" | "medium";
  tags?: string[];
  task_id?: number;
}

export interface CreateBlockData {
  title: string;
  start_time: string;
  end_time: string;
  type: "deep_work" | "meeting" | "external";
  description?: string;
  priority?: "high" | "low" | "urgent" | "medium";
  tags?: string[];
  task_id?: number;
}

export interface UpdateBlockData {
  title?: string;
  start_time?: string;
  end_time?: string;
  type?: "deep_work" | "meeting" | "external";
  description?: string;
}

export interface CalendarEventsResponse {
  data: CalendarEvent[];
}
