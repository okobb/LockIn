import { useState, useEffect } from "react";
import {
  MessageSquare,
  Calendar,
  Mail,
  Settings as SettingsIcon,
  Globe,
} from "lucide-react";
import Sidebar from "../../../../shared/components/Sidebar/Sidebar";
import { useIntegrations } from "../../hooks/useIntegrations";
import { useAuthContext } from "../../../auth/context/AuthContext";
import { useModal } from "../../../../shared/context/ModalContext";
import { user as userApi } from "../../api/user";
import "./Settings.css";

// Common timezones grouped by region
const TIMEZONE_OPTIONS = [
  {
    group: "Americas",
    zones: [
      { value: "America/New_York", label: "Eastern Time (US & Canada)" },
      { value: "America/Chicago", label: "Central Time (US & Canada)" },
      { value: "America/Denver", label: "Mountain Time (US & Canada)" },
      { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
      { value: "America/Sao_Paulo", label: "São Paulo" },
    ],
  },
  {
    group: "Europe",
    zones: [
      { value: "Europe/London", label: "London" },
      { value: "Europe/Paris", label: "Paris" },
      { value: "Europe/Berlin", label: "Berlin" },
      { value: "Europe/Bucharest", label: "Bucharest" },
      { value: "Europe/Moscow", label: "Moscow" },
    ],
  },
  {
    group: "Asia & Pacific",
    zones: [
      { value: "Asia/Dubai", label: "Dubai" },
      { value: "Asia/Kolkata", label: "Mumbai, Kolkata" },
      { value: "Asia/Singapore", label: "Singapore" },
      { value: "Asia/Tokyo", label: "Tokyo" },
      { value: "Australia/Sydney", label: "Sydney" },
    ],
  },
  { group: "Other", zones: [{ value: "UTC", label: "UTC" }] },
];

const GitHubIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
  </svg>
);

function getIntegrationIcon(iconName: string) {
  switch (iconName) {
    case "message-square":
      return <MessageSquare size={20} />;
    case "github":
      return <GitHubIcon />;
    case "google":
      return <GoogleIcon />;
    case "calendar":
      return <Calendar size={20} />;
    case "mail":
      return <Mail size={20} />;
    default:
      return <SettingsIcon size={20} />;
  }
}

export default function Settings() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, setAuth } = useAuthContext();
  const { open: openModal } = useModal();
  const [timezone, setTimezone] = useState(() => {
    // Use user's saved timezone or auto-detect from browser
    return user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  });
  const [isSavingTimezone, setIsSavingTimezone] = useState(false);

  const {
    availableIntegrations,
    isLoading,
    isConnected,
    getIntegration,
    connect,
    disconnect,
    connectingKey,
    disconnectingId,
  } = useIntegrations({
    onError: (message) => {
      openModal({
        type: "error",
        title: "Connection Error",
        message,
        confirmText: "OK",
      });
    },
  });

  // Auto-save timezone on first render if user doesn't have one set
  useEffect(() => {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (
      user &&
      (!user.timezone || user.timezone === "UTC") &&
      browserTimezone
    ) {
      handleTimezoneChange(browserTimezone);
    }
  }, []);

  const handleTimezoneChange = async (newTimezone: string) => {
    if (!user) return;
    setTimezone(newTimezone);
    setIsSavingTimezone(true);
    try {
      const response = await userApi.updateProfile(user.id, {
        timezone: newTimezone,
      });
      // Update auth context with new timezone
      setAuth(
        { ...user, timezone: response.data.timezone },
        localStorage.getItem("token") || ""
      );
    } catch (error) {
      console.error("Failed to save timezone:", error);
      // Revert on error
      setTimezone(user.timezone || "UTC");
    } finally {
      setIsSavingTimezone(false);
    }
  };

  return (
    <div className="settings-layout">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main
        className={`settings-content ${
          isSidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <header className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">
            Manage your integrations and preferences
          </p>
        </header>

        <section className="settings-section">
          <h2 className="section-title">Account</h2>
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Current Plan</div>
              <div className="setting-description">You're on the Free tier</div>
            </div>
            <button className="btn btn-primary">Upgrade to Pro</button>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">Preferences</h2>
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">
                <Globe
                  size={16}
                  style={{ marginRight: "8px", verticalAlign: "middle" }}
                />
                Timezone
              </div>
              <div className="setting-description">
                Your calendar events will be displayed in this timezone
              </div>
            </div>
            <select
              className="form-select"
              value={timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              disabled={isSavingTimezone}
            >
              {TIMEZONE_OPTIONS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.zones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">Integrations</h2>

          {isLoading ? (
            <div className="loading-state">Loading integrations...</div>
          ) : (
            availableIntegrations.map((config) => {
              const connected = isConnected(config.provider, config.service);
              const integration = getIntegration(config.provider);
              const isProcessingDisconnect =
                integration && disconnectingId === integration.id;

              return (
                <div
                  key={`${config.provider}-${config.service}`}
                  className="integration-card"
                >
                  <div className="integration-icon">
                    {getIntegrationIcon(config.icon)}
                  </div>
                  <div className="integration-info">
                    <div className="integration-name">
                      {config.name}
                      {config.description && (
                        <span className="integration-description">
                          {" "}
                          — {config.description}
                        </span>
                      )}
                    </div>
                    <div className="integration-status">
                      {connected ? (
                        <>
                          <span className="status-badge status-connected">
                            ● Connected
                          </span>
                          <span>Active integration</span>
                        </>
                      ) : (
                        <span className="status-badge status-disconnected">
                          ● Not Connected
                        </span>
                      )}
                    </div>
                  </div>
                  {connected ? (
                    <button
                      className="btn-danger"
                      onClick={() => integration && disconnect(integration.id)}
                      disabled={isProcessingDisconnect}
                    >
                      {isProcessingDisconnect
                        ? "Disconnecting..."
                        : "Disconnect"}
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => connect(config.provider, config.service)}
                      disabled={connectingKey !== null}
                    >
                      {connectingKey === `${config.provider}-${config.service}`
                        ? "Connecting..."
                        : "Connect"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </section>

        <section className="settings-section">
          <h2 className="section-title">Focus Mode</h2>

          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Default Timer Duration</div>
            </div>
            <select className="form-select" defaultValue="45">
              <option value="25">25 minutes (Pomodoro)</option>
              <option value="45">45 minutes</option>
              <option value="90">90 minutes (Deep Work)</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="setting-row">
            <div className="setting-info" style={{ flex: 1 }}>
              <div className="setting-label">
                Urgent Keywords (bypasses Focus Mode)
              </div>
              <input
                type="text"
                className="form-input"
                placeholder="Add keyword and press Enter"
                style={{ marginTop: "var(--space-2)" }}
              />
              <div className="keyword-tags">
                <span className="keyword-tag">
                  production down <button className="keyword-remove">×</button>
                </span>
                <span className="keyword-tag">
                  urgent <button className="keyword-remove">×</button>
                </span>
                <span className="keyword-tag">
                  blocking <button className="keyword-remove">×</button>
                </span>
                <span className="keyword-tag">
                  p0 <button className="keyword-remove">×</button>
                </span>
              </div>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Auto-save Context</div>
              <div className="setting-description">
                Automatically save your context before calendar meetings
              </div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Update Slack Status</div>
              <div className="setting-description">
                Set status to "In Focus Mode" during deep work
              </div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider" />
            </label>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">Notifications</h2>

          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Browser Push Notifications</div>
              <div className="setting-description">
                Get notified of urgent messages
              </div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Daily Briefing Reminder</div>
              <div className="setting-description">
                Remind me to check my morning briefing at 9:00 AM
              </div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">End of Day Save Prompt</div>
              <div className="setting-description">
                Prompt to save context at 5:30 PM
              </div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider" />
            </label>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">Learning Engine</h2>

          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Proactive Suggestions</div>
              <div className="setting-description">
                Show relevant saved resources while you work
              </div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Liquid Scheduler</div>
              <div className="setting-description">
                Auto-schedule learning content in calendar gaps
              </div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" />
              <span className="toggle-slider" />
            </label>
          </div>
        </section>

        <section className="settings-section danger-section">
          <h2 className="section-title">Danger Zone</h2>

          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Clear All Contexts</div>
              <div className="setting-description">
                Delete all saved cognitive snapshots
              </div>
            </div>
            <button className="btn-danger">Clear</button>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Delete Account</div>
              <div className="setting-description">
                Permanently delete your Lock In account
              </div>
            </div>
            <button className="btn-danger-solid">Delete Account</button>
          </div>
        </section>
      </main>
    </div>
  );
}
