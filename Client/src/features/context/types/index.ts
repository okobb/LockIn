export interface BrowserTab {
  title: string;
  url: string;
}

export interface GitState {
  branch: string;
  repo: string;
  diff?: string;
  files_changed?: string[];
}

export interface SaveContextRequest {
  focus_session_id: number;
  note?: string;
  browser_state?: BrowserTab[];
  git_state?: GitState;
  voice_file?: File;
}

export interface SaveContextResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    created_at: string;
  };
}
