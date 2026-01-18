export type ResourceType =
  | "article"
  | "video"
  | "document"
  | "image"
  | "website"
  | "documentation";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Resource {
  id: number;
  type: ResourceType;
  title: string;
  url: string | null;
  file_path: string | null;
  thumbnail_url: string | null;
  summary: string | null;
  notes: string | null;
  tags: string[];
  difficulty: Difficulty | null;
  estimated_time_minutes: number | null;
  is_read: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  is_ai_suggested?: boolean;
  source_domain: string | null;
  focus_session_id: number | null;
  created_at: string;
  _isProcessing?: boolean;
}

export interface ResourceFilters {
  search?: string;
  type?: ResourceType | ResourceType[] | "all";
  status?: "all" | "unread" | "read" | "favorites" | "ai_suggested";
  difficulty?: Difficulty | Difficulty[] | "all";
}

export interface CreateResourceRequest {
  url?: string;
  file?: File;
  title?: string;
  notes?: string;
  tags?: string[];
  difficulty?: Difficulty;
  type?: ResourceType;
  focus_session_id?: number;
}
