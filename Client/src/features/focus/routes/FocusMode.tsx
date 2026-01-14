import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Zap,
  CheckCircle,
  Clock,
  LayoutDashboard,
  Search,
  Settings,
  Wrench,
  Pause,
  Plus,
  Bell,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Mic,
  Save,
} from "lucide-react";
import { useModal } from "../../../shared/context/ModalContext";
import { saveContextSnapshot } from "../../context/api/saveContext";
import "./FocusMode.css";
import { useFocusSession } from "../hooks/useFocusSession";

interface FocusState {
  taskId?: number;
  title: string;
  isFreestyle?: boolean;
  sessionId?: number;
}

export default function FocusMode() {
  const location = useLocation();
  const navigate = useNavigate();
  const { open } = useModal();

  const locationState = location.state as FocusState | null;
  const [restoredState, setRestoredState] = useState<FocusState | null>(null);

  const activeState = locationState || restoredState;

  const { session } = useFocusSession(activeState);

  const [isContextCollapsed, setIsContextCollapsed] = useState(false);
  const [timer, setTimer] = useState(25 * 60); // 25 minutes in seconds
  const [isPaused, setIsPaused] = useState(false);

  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Try to restore from localStorage if no location state
    if (!locationState) {
      const stored = localStorage.getItem("current_focus_session");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log("Restoring session from storage:", parsed);
          setRestoredState(parsed);
          // Note: useFocusSession handles the session init based on this state now
        } catch (e) {
          console.error("Failed to parse stored session", e);
        }
      }
    }
  }, [locationState]);

  // Timer logic
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePause = () => setIsPaused(!isPaused);

  // Handle Lock In (Save Context)
  const handleLockIn = async () => {
    setIsSaving(true);
    console.log("Starting Lock In...");

    try {
      // Fallback: use state.taskId relative to tasks if session ID is missing (though backend needs session_id)
      // Ideally session.id should be present if startSession worked.
      const payloadSessionId = session?.id || (activeState as any)?.sessionId;

      if (!payloadSessionId) {
        console.error("No Session ID found!", { session, activeState });
        // If the session didn't start correctly, we can't save context to it.
        open({
          type: "error",
          title: "Save Failed",
          message:
            "Could not find an active session ID. Please try restarting your session from the dashboard.",
        });
        setIsSaving(false);
        return;
      }

      // MOCK Browser State
      const mockBrowserTabs = [
        { title: "Laravel Docs", url: "https://laravel.com/docs" },
        { title: "React Router", url: "https://reactrouter.com/" },
        {
          title: "Stack Overflow - Context API",
          url: "https://stackoverflow.com/questions/...",
        },
      ];

      // MOCK Git State
      const mockGitState = {
        branch: "feature/login",
        diff: "diff --git a/file.ts b/file.ts...",
        files_changed: ["file.ts"],
        repo: "LockIn", // Added generic repo name
      };

      console.log("Sending payload to /context/save...", {
        id: payloadSessionId,
        note,
        browser: mockBrowserTabs,
      });

      // Use the refactored API service
      const response = await saveContextSnapshot({
        focus_session_id: payloadSessionId,
        note,
        browser_state: mockBrowserTabs,
        git_state: mockGitState,
      });

      console.log("Response:", response);

      // Clear persistence on success
      localStorage.removeItem("current_focus_session");

      open({
        type: "info",
        title: "Context Locked In!",
        message: "Your session context has been saved successfully.",
        confirmText: "Back to Dashboard",
      }).then(() => {
        navigate("/dashboard");
      });
    } catch (error: any) {
      console.error("Lock In failed", error);
      console.error("Error Response:", error.response?.data);

      const status = error.response?.status
        ? ` (Status: ${error.response.status})`
        : "";
      let errorMessage =
        error.response?.data?.message || "Could not save your session context.";

      // Append detailed validation errors if available
      if (error.response?.data?.errors) {
        const details = Object.values(error.response.data.errors)
          .flat()
          .join(", ");
        errorMessage += `\nDetails: ${details}`;
      }

      open({
        type: "error",
        title: "Save Failed" + status,
        message: `${errorMessage}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!activeState) {
    return (
      <div
        className="focus-container"
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <div className="mission-panel">
          <h2>No active mission</h2>
          <button className="btn" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="focus-container">
      {/* Compact Sidebar */}
      <aside className="focus-sidebar">
        <a href="/" className="focus-sidebar-logo">
          <img
            src="/Project logo.png"
            alt="Lock In"
            style={{ width: 32, height: 32 }}
          />
        </a>

        <button
          className="sidebar-icon-btn"
          onClick={() => navigate("/dashboard")}
        >
          <LayoutDashboard size={20} className="icon" />
          <span className="tooltip">Dashboard</span>
        </button>

        <button className="sidebar-icon-btn active">
          <Zap size={20} className="icon" />
          <span className="tooltip">Focus Mode</span>
        </button>

        <button className="sidebar-icon-btn">
          <Search size={20} className="icon" />
          <span className="tooltip">Search</span>
        </button>

        <div style={{ flex: 1 }}></div>

        <button className="sidebar-icon-btn">
          <Settings size={20} className="icon" />
          <span className="tooltip">Settings</span>
        </button>
      </aside>

      {/* Progress Bar */}
      <div className="progress-line">
        <div className="progress-fill" style={{ width: "100%" }}></div>
      </div>

      {/* Main Content */}
      <main className="focus-main">
        {/* Mission Panel */}
        <section className="mission-panel">
          <header className="mission-header">
            <div className="mission-meta">
              <span
                className="tag tag-amber"
                style={{
                  color: "var(--accent-amber)",
                  background: "rgba(245, 158, 11, 0.1)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                High Priority
              </span>
              <span className="mission-source">
                {activeState.isFreestyle
                  ? "Freestyle Session"
                  : "Started manually"}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--font-size-base)",
                  fontWeight: 500,
                  color: "var(--text-muted)",
                }}
              >
                {formatTime(timer)}
              </span>
            </div>
            <h1 className="mission-title">
              <Wrench size={32} className="icon icon-xl" />
              {activeState.title}
            </h1>
          </header>

          <div className="keyboard-hints">
            <div className="keyboard-hint">
              <kbd
                className="kbd"
                style={{
                  background: "var(--bg-elevated)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "1px solid var(--border-default)",
                }}
              >
                Space
              </kbd>
              <span>Toggle pause</span>
            </div>
            <div className="keyboard-hint">
              <kbd
                className="kbd"
                style={{
                  background: "var(--bg-elevated)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "1px solid var(--border-default)",
                }}
              >
                ↑↓
              </kbd>
              <span>Navigate tasks</span>
            </div>
            <div className="keyboard-hint">
              <kbd
                className="kbd"
                style={{
                  background: "var(--bg-elevated)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "1px solid var(--border-default)",
                }}
              >
                C
              </kbd>
              <span>Toggle context</span>
            </div>
          </div>

          {/* Checklist */}
          <div className="checklist-header">
            <span className="checklist-title">Mission Checklist</span>
            <button
              className="btn"
              style={{
                marginLeft: "auto",
                marginRight: "var(--space-3)",
                padding: "4px 8px",
                fontSize: "13px",
              }}
            >
              <Plus size={14} className="icon icon-sm" />
              Add Step
            </button>
            <span className="checklist-progress">0 of 4 complete</span>
          </div>

          <div className="checklist-container">
            {/* Hardcoded items for design parity with mockup */}
            <label className="check-item">
              <input type="checkbox" />
              <div className="check-content">
                <span className="check-text">
                  Check session.php configuration
                </span>
                <div className="check-meta">
                  config/session.php • You changed cookie lifetime
                </div>
              </div>
            </label>

            <label className="check-item">
              <input type="checkbox" />
              <div className="check-content">
                <span className="check-text">
                  Verify refresh token database writes
                </span>
                <div className="check-meta">
                  Reasoning: "Values were null in last test"
                </div>
              </div>
            </label>

            <label className="check-item">
              <input type="checkbox" />
              <div className="check-content">
                <span className="check-text">
                  Test OAuth flow with logging enabled
                </span>
                <div className="check-meta">
                  Use Log::info() on callback route
                </div>
              </div>
            </label>

            <label className="check-item">
              <input type="checkbox" />
              <div className="check-content">
                <span className="check-text">Commit Fixes</span>
                <div className="check-meta">Branch: feature/oauth-refactor</div>
              </div>
            </label>
          </div>

          {/* Note Input */}
          <div
            className="session-note-container"
            style={{ marginTop: "1.5rem" }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "var(--text-secondary)",
              }}
            >
              Session Notes
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Jot down what you accomplished..."
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--border-default)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div className="actions-row">
            <button
              className="btn"
              onClick={togglePause}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
              }}
            >
              <Pause size={18} className="icon" />
              <span>{isPaused ? "Resume Session" : "Pause Session"}</span>
            </button>
            <button
              className="btn"
              onClick={() => setTimer((t) => t + 300)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
              }}
            >
              <Clock size={18} className="icon" />
              +5 Minutes
            </button>
            <div style={{ flex: 1 }}></div>

            <button
              className="btn"
              style={{
                color: "white",
                background: "var(--accent-primary)",
                border: "1px solid var(--accent-primary)",
                opacity: isSaving ? 0.7 : 1,
              }}
              onClick={handleLockIn}
              disabled={isSaving}
            >
              <Save size={18} className="icon" />
              {isSaving ? "Saving..." : "Lock In Session"}
            </button>
          </div>
        </section>

        {/* Context Sidebar */}
        <aside
          className={`context-sidebar ${isContextCollapsed ? "collapsed" : ""}`}
        >
          {/* Toggle Bar */}
          <div className="sidebar-toggle-bar">
            <div className="sidebar-toggle-label">
              <span>Context & Resources</span>
            </div>
            <button
              className="sidebar-toggle"
              onClick={() => setIsContextCollapsed(!isContextCollapsed)}
            >
              {isContextCollapsed ? (
                <ChevronLeft size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          </div>

          {!isContextCollapsed && (
            <>
              {/* Notifications */}
              <div className="context-card">
                <div className="context-card-header">
                  <Bell size={16} className="icon" />
                  <span className="context-card-title">Notifications</span>
                </div>
                <div className="notif-status">
                  <CheckCircle size={16} className="icon" />
                  <div className="notif-status-text">
                    <div className="notif-status-title">Optimized for Flow</div>
                    <div className="notif-status-detail">
                      Only urgent alerts
                    </div>
                  </div>
                </div>
              </div>

              {/* Version Control - Only for linked tasks */}
              {!activeState.isFreestyle && (
                <div className="context-card">
                  <div className="context-card-header">
                    <GitBranch size={16} className="icon" />
                    <span className="context-card-title">Version Control</span>
                  </div>
                  <div className="git-branch">
                    <GitBranch size={16} className="icon" />
                    <span className="git-branch-name">
                      feature/oauth-refactor
                    </span>
                  </div>
                  <div className="git-file">
                    <span className="git-file-name">auth.ts</span>
                    <div className="git-file-stats">
                      <span className="git-add">+24</span>
                      <span className="git-del">-12</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Voice Note */}
              <div className="context-card">
                <div className="context-card-header">
                  <Mic size={16} className="icon" />
                  <span className="context-card-title">Recent Voice Memo</span>
                </div>
                <div className="voice-transcript">
                  "Remember to check the session timeout setting in config files
                  before deploying..."
                </div>
                <div className="voice-time">2 mins ago</div>
              </div>
            </>
          )}
        </aside>
      </main>
    </div>
  );
}
