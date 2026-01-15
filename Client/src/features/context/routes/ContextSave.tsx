import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  Scan,
  Globe,
  FileCode,
  GitBranch,
  Clock,
  Target,
  MessageSquare,
  Mic,
  Type,
  Cpu,
  Loader,
  CheckCircle,
  Square,
} from "lucide-react";
import { saveContextSnapshot } from "../api/saveContext";
import "./ContextSave.css";

type Tab = "voice" | "text" | "auto";

export const ContextSave = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("voice");
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [contextText, setContextText] = useState("");
  const [taskName, setTaskName] = useState("");

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      setIsRecording(true);
      setTimer(0);
      intervalRef.current = window.setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Mock data for now, matching the HTML mockup's "Capturing" section
      // In a real app, this would come from an actual browser extension or backend state
      const mockBrowserTabs = Array(8).fill({
        title: "Mock Tab",
        url: "https://example.com",
      });
      const mockGitState = {
        branch: "feature/auth",
        files_changed: ["file1.ts", "file2.ts", "file3.ts"],
        repo: "LockIn",
        diff: "diff...",
      };

      // Assuming we link to the most recent active session or just create a snapshot freely
      // The API requires a session ID, but for this "Context Save" feature which might be standalone,
      // we might need to fetch the active session ID first.
      // For now, we'll try to get it from storage or params, else fail gracefully or pass null if API allows (it doesn't).
      //
      // HACK: We will try to read the last known session from localStorage
      let sessionId = null;
      try {
        const stored = localStorage.getItem("current_focus_session");
        if (stored) {
          sessionId = JSON.parse(stored).sessionId;
        }
      } catch (e) {
        console.error("No session found");
      }

      if (!sessionId) {
        // Fallback or Error?
        // Let's assume the user is "Locking In" for a NEW unstarted session if none exists?
        // Or we just error out.
        // For the sake of the UI demo working:
        console.warn("No active session ID found. Using mock ID 1 for demo.");
        sessionId = 1;
      }

      await saveContextSnapshot({
        focus_session_id: sessionId,
        note:
          contextText ||
          (activeTab === "voice"
            ? "Voice Note recorded"
            : "Auto-generated context"),
        browser_state: mockBrowserTabs,
        git_state: mockGitState,
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Failed to save context", error);
      alert("Failed to save context. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    // Simple confirm
    if (window.confirm("Discard unsaved context?")) {
      navigate(-1);
    }
  };

  return (
    <div className="context-save-overlay">
      <div className="context-save-modal">
        <div className="modal-header">
          <div className="modal-title">
            <Save className="icon" size={24} />
            <span>Save Context</span>
          </div>
          <button className="modal-close" onClick={closeModal}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* Capturing Summary */}
          <div className="section">
            <div className="section-label">
              <Scan className="icon icon-sm" size={14} />
              Capturing
            </div>
            <div className="capture-grid">
              <div className="capture-item">
                <Globe className="icon icon-sm capture-icon" size={16} />
                <span className="capture-text">
                  <span className="capture-value">8</span> browser tabs
                </span>
              </div>
              <div className="capture-item">
                <FileCode className="icon icon-sm capture-icon" size={16} />
                <span className="capture-text">
                  <span className="capture-value">3</span> uncommitted files
                </span>
              </div>
              <div className="capture-item">
                <GitBranch className="icon icon-sm capture-icon" size={16} />
                <span className="capture-text">
                  Branch: <span className="capture-value">feature/auth</span>
                </span>
              </div>
              <div className="capture-item">
                <Clock className="icon icon-sm capture-icon" size={16} />
                <span className="capture-text">
                  Timestamp: <span className="capture-value">Now</span>
                </span>
              </div>
            </div>
          </div>

          {/* Task Name */}
          <div className="section">
            <div className="section-label">
              <Target className="icon icon-sm" size={14} />
              Task Name (Optional)
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Refactor User Authentication"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
            <div className="form-hint">
              AI will auto-detect from your branch name if left empty
            </div>
          </div>

          {/* Context Input */}
          <div className="section">
            <div className="section-label">
              <MessageSquare className="icon icon-sm" size={14} />
              Add Your Context
            </div>

            {/* Tabs */}
            <div className="tab-group">
              <button
                className={`tab-btn ${activeTab === "voice" ? "active" : ""}`}
                onClick={() => setActiveTab("voice")}
              >
                <Mic className="icon icon-sm" size={14} />
                Voice
              </button>
              <button
                className={`tab-btn ${activeTab === "text" ? "active" : ""}`}
                onClick={() => setActiveTab("text")}
              >
                <Type className="icon icon-sm" size={14} />
                Text
              </button>
              <button
                className={`tab-btn ${activeTab === "auto" ? "active" : ""}`}
                onClick={() => setActiveTab("auto")}
              >
                <Cpu className="icon icon-sm" size={14} />
                Auto
              </button>
            </div>

            {/* Voice Tab */}
            {activeTab === "voice" && (
              <div
                className={`recorder-area ${isRecording ? "recording" : ""}`}
              >
                <button
                  className={`record-btn ${isRecording ? "recording" : ""}`}
                  onClick={toggleRecording}
                >
                  {isRecording ? (
                    <Square size={24} fill="currentColor" />
                  ) : (
                    <Mic className="icon" size={24} />
                  )}
                </button>
                <div
                  className={`timer-display ${isRecording ? "recording" : ""}`}
                >
                  {formatTime(timer)}
                </div>
                <p className="recorder-hint">
                  {isRecording ? "Recording..." : "Click to start recording"}
                </p>
              </div>
            )}

            {/* Text Tab */}
            {activeTab === "text" && (
              <textarea
                className="form-textarea"
                placeholder="I was debugging the OAuth callback. The refresh token isn't being stored correctly..."
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
              />
            )}

            {/* Auto Tab */}
            {activeTab === "auto" && (
              <div className="auto-context">
                <Cpu
                  className="icon auto-icon"
                  size={48}
                  style={{ width: 48, height: 48 }}
                />
                <div className="auto-title">AI-Generated Context</div>
                <p className="auto-description">
                  Lock In will analyze your git diff and open tabs to generate a
                  context summary automatically.
                </p>
                <div className="auto-note">Takes 5-10 seconds after saving</div>
              </div>
            )}
          </div>

          {/* Save Button */}
          {!isSuccess && (
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader className="icon animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="icon" size={18} />
                  Save Context
                </>
              )}
            </button>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="success-message">
              <CheckCircle className="icon success-icon" size={24} />
              <div>
                <div className="success-text">Context Saved!</div>
                <div className="success-sub">Redirecting to dashboard...</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
