import { useState, useEffect } from "react";
import {
  MessageSquare,
  Calendar,
  Mail,
  Settings as SettingsIcon,
  Globe,
  Loader2,
} from "lucide-react";
import Sidebar from "../../../../shared/components/Sidebar/Sidebar";
import { useIntegrations } from "../../hooks/useIntegrations";
import { useAuthContext } from "../../../auth/context/AuthContext";
import { useModal } from "../../../../shared/context/ModalContext";
import { user as userApi } from "../../api/user";
import { cn } from "../../../../shared/lib/utils";
import { Button } from "../../../../shared/components/UI/Button";
import { Switch } from "../../../../shared/components/UI/Switch";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../../../../shared/components/UI/Card";

const TIMEZONE_OPTIONS = [
  {
    group: "Americas",
    zones: [
      { value: "America/New_York", label: "Eastern Time (US & Canada)" },
      { value: "America/Chicago", label: "Central Time (US & Canada)" },
      { value: "America/Denver", label: "Mountain Time (US & Canada)" },
      { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
      { value: "America/Anchorage", label: "Alaska" },
      { value: "Pacific/Honolulu", label: "Hawaii" },
      { value: "America/Toronto", label: "Toronto" },
      { value: "America/Vancouver", label: "Vancouver" },
      { value: "America/Mexico_City", label: "Mexico City" },
      { value: "America/Bogota", label: "Bogotá" },
      { value: "America/Lima", label: "Lima" },
      { value: "America/Santiago", label: "Santiago" },
      { value: "America/Buenos_Aires", label: "Buenos Aires" },
      { value: "America/Sao_Paulo", label: "São Paulo" },
    ],
  },
  {
    group: "Europe",
    zones: [
      { value: "Europe/London", label: "London (GMT/BST)" },
      { value: "Europe/Dublin", label: "Dublin" },
      { value: "Europe/Paris", label: "Paris" },
      { value: "Europe/Berlin", label: "Berlin" },
      { value: "Europe/Amsterdam", label: "Amsterdam" },
      { value: "Europe/Brussels", label: "Brussels" },
      { value: "Europe/Madrid", label: "Madrid" },
      { value: "Europe/Rome", label: "Rome" },
      { value: "Europe/Zurich", label: "Zurich" },
      { value: "Europe/Vienna", label: "Vienna" },
      { value: "Europe/Prague", label: "Prague" },
      { value: "Europe/Warsaw", label: "Warsaw" },
      { value: "Europe/Stockholm", label: "Stockholm" },
      { value: "Europe/Helsinki", label: "Helsinki" },
      { value: "Europe/Athens", label: "Athens" },
      { value: "Europe/Bucharest", label: "Bucharest" },
      { value: "Europe/Kyiv", label: "Kyiv" },
      { value: "Europe/Moscow", label: "Moscow" },
      { value: "Europe/Istanbul", label: "Istanbul" },
    ],
  },
  {
    group: "Africa",
    zones: [
      { value: "Africa/Cairo", label: "Cairo" },
      { value: "Africa/Casablanca", label: "Casablanca" },
      { value: "Africa/Lagos", label: "Lagos" },
      { value: "Africa/Johannesburg", label: "Johannesburg" },
      { value: "Africa/Nairobi", label: "Nairobi" },
      { value: "Africa/Algiers", label: "Algiers" },
      { value: "Africa/Accra", label: "Accra" },
    ],
  },
  {
    group: "Middle East",
    zones: [
      { value: "Asia/Jerusalem", label: "Jerusalem" },
      { value: "Asia/Beirut", label: "Beirut" },
      { value: "Asia/Riyadh", label: "Riyadh" },
      { value: "Asia/Dubai", label: "Dubai" },
      { value: "Asia/Qatar", label: "Qatar" },
      { value: "Asia/Kuwait", label: "Kuwait" },
      { value: "Asia/Tehran", label: "Tehran" },
    ],
  },
  {
    group: "Asia",
    zones: [
      { value: "Asia/Kolkata", label: "Mumbai, Kolkata, New Delhi" },
      { value: "Asia/Dhaka", label: "Dhaka" },
      { value: "Asia/Kathmandu", label: "Kathmandu" },
      { value: "Asia/Karachi", label: "Karachi" },
      { value: "Asia/Tashkent", label: "Tashkent" },
      { value: "Asia/Almaty", label: "Almaty" },
      { value: "Asia/Bangkok", label: "Bangkok" },
      { value: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh City" },
      { value: "Asia/Jakarta", label: "Jakarta" },
      { value: "Asia/Singapore", label: "Singapore" },
      { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur" },
      { value: "Asia/Manila", label: "Manila" },
      { value: "Asia/Hong_Kong", label: "Hong Kong" },
      { value: "Asia/Taipei", label: "Taipei" },
      { value: "Asia/Shanghai", label: "Beijing, Shanghai" },
      { value: "Asia/Seoul", label: "Seoul" },
      { value: "Asia/Tokyo", label: "Tokyo" },
    ],
  },
  {
    group: "Australia & Pacific",
    zones: [
      { value: "Australia/Perth", label: "Perth" },
      { value: "Australia/Adelaide", label: "Adelaide" },
      { value: "Australia/Brisbane", label: "Brisbane" },
      { value: "Australia/Sydney", label: "Sydney" },
      { value: "Australia/Melbourne", label: "Melbourne" },
      { value: "Pacific/Auckland", label: "Auckland" },
      { value: "Pacific/Fiji", label: "Fiji" },
      { value: "Pacific/Guam", label: "Guam" },
    ],
  },
  {
    group: "Other",
    zones: [{ value: "UTC", label: "UTC (Coordinated Universal Time)" }],
  },
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

const getTimezoneLabel = (value: string, label: string) => {
  if (value === "UTC") return `(GMT+00:00) ${label}`;
  try {
    const offset = new Intl.DateTimeFormat("en-US", {
      timeZone: value,
      timeZoneName: "longOffset",
    })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;

    return `(${offset}) ${label}`;
  } catch (error) {
    return label;
  }
};

export default function Settings() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, setAuth } = useAuthContext();
  const { open: openModal } = useModal();
  const [timezone, setTimezone] = useState(() => {
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
      setAuth(
        { ...user, timezone: response.data.timezone },
        localStorage.getItem("token") || "",
      );
    } catch (error) {
      console.error("Failed to save timezone:", error);
      setTimezone(user.timezone || "UTC");
    } finally {
      setIsSavingTimezone(false);
    }
  };

  const SettingRow = ({
    label,
    description,
    children,
    className,
  }: {
    label: React.ReactNode;
    description?: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={cn(
        "flex flex-col sm:flex-row justify-between sm:items-center py-4 border-t border-border first:border-0 first:pt-0 gap-4 sm:gap-0",
        className,
      )}
    >
      <div className="flex-1 pr-4">
        <div className="font-semibold text-foreground mb-1 flex items-center">
          {label}
        </div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your integrations and preferences
          </p>
        </header>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingRow
                label="Current Plan"
                description="You're on the Free tier"
              >
                <Button>Upgrade to Pro</Button>
              </SettingRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingRow
                label={
                  <>
                    <Globe size={16} className="mr-2" />
                    Timezone
                  </>
                }
                description="Your calendar events will be displayed in this timezone"
              >
                <select
                  className="w-full sm:w-auto px-3 py-2 bg-background border border-border rounded-md text-sm min-w-[200px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={timezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  disabled={isSavingTimezone}
                >
                  {TIMEZONE_OPTIONS.map((group) => (
                    <optgroup key={group.group} label={group.group}>
                      {group.zones.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {getTimezoneLabel(tz.value, tz.label)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </SettingRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect your external tools to Lock In.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading integrations...
                </div>
              ) : (
                <div className="space-y-4">
                  {availableIntegrations.map((config) => {
                    const connected = isConnected(
                      config.provider,
                      config.service,
                    );
                    const integration = getIntegration(config.provider);
                    const isProcessingDisconnect =
                      integration && disconnectingId === integration.id;

                    return (
                      <div
                        key={`${config.provider}-${config.service}`}
                        className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-secondary/20 border border-border rounded-lg"
                      >
                        <div className="w-12 h-12 bg-background rounded-md flex items-center justify-center text-muted-foreground shrink-0 border border-border/50">
                          {getIntegrationIcon(config.icon)}
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <div className="font-semibold text-foreground mb-1">
                            {config.name}
                            {config.description && (
                              <span className="font-normal text-muted-foreground text-sm">
                                {" "}
                                — {config.description}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
                            {connected ? (
                              <>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  ● Connected
                                </span>
                              </>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary text-muted-foreground">
                                ● Not Connected
                              </span>
                            )}
                          </div>
                        </div>
                        {connected ? (
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                            onClick={() =>
                              integration && disconnect(integration.id)
                            }
                            disabled={isProcessingDisconnect}
                          >
                            {isProcessingDisconnect
                              ? "Disconnecting..."
                              : "Disconnect"}
                          </Button>
                        ) : (
                          <Button
                            className="w-full sm:w-auto"
                            onClick={() =>
                              connect(config.provider, config.service)
                            }
                            disabled={connectingKey !== null}
                          >
                            {connectingKey ===
                            `${config.provider}-${config.service}`
                              ? "Connecting..."
                              : "Connect"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Focus Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingRow
                label="Calendar Sync Frequency"
                description="How often to automatically sync your calendar"
              >
                <select
                  className="w-full sm:w-auto px-3 py-2 bg-background border border-border rounded-md text-sm min-w-[200px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={user?.preferences?.calendar_sync_frequency || "manual"}
                  onChange={(e) => {
                    if (!user) return;
                    const newPreferences = {
                      ...user.preferences,
                      calendar_sync_frequency: e.target.value as
                        | "manual"
                        | "daily"
                        | "weekly",
                    };
                    setAuth(
                      { ...user, preferences: newPreferences },
                      localStorage.getItem("token") || "",
                    );
                    userApi.updateProfile(user.id, {
                      preferences: newPreferences,
                    });
                  }}
                >
                  <option value="manual">Manual (Sync button only)</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </SettingRow>

              <SettingRow label="Default Timer Duration">
                <select
                  className="w-full sm:w-auto px-3 py-2 bg-background border border-border rounded-md text-sm min-w-[200px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  defaultValue="45"
                >
                  <option value="25">25 minutes (Pomodoro)</option>
                  <option value="45">45 minutes</option>
                  <option value="90">90 minutes (Deep Work)</option>
                  <option value="custom">Custom</option>
                </select>
              </SettingRow>

              <SettingRow
                label="Urgent Keywords (bypasses Focus Mode)"
                className="items-start flex-col sm:flex-row sm:items-start"
              >
                <div className="w-full sm:w-auto flex flex-col items-end gap-2">
                  <input
                    type="text"
                    className="w-full sm:w-64 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Add keyword and press Enter"
                  />
                  <div className="flex flex-wrap gap-2 justify-end w-full">
                    {["production down", "urgent", "blocking", "p0"].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-2 px-2 py-1 bg-secondary text-secondary-foreground border border-border rounded text-xs font-medium"
                        >
                          {tag}
                          <button className="text-muted-foreground hover:text-destructive transition-colors focus:outline-none ml-1">
                            ×
                          </button>
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </SettingRow>

              <SettingRow
                label="Auto-save Context"
                description="Automatically save your context before calendar meetings"
              >
                <Switch checked={true} onCheckedChange={() => {}} />
              </SettingRow>

              <SettingRow
                label="Update Slack Status"
                description='Set status to "In Focus Mode" during deep work'
              >
                <Switch checked={true} onCheckedChange={() => {}} />
              </SettingRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingRow
                label="Browser Push Notifications"
                description="Get notified of urgent messages"
              >
                <Switch checked={true} onCheckedChange={() => {}} />
              </SettingRow>

              <SettingRow
                label="Daily Briefing Reminder"
                description="Remind me to check my morning briefing at 9:00 AM"
              >
                <Switch checked={true} onCheckedChange={() => {}} />
              </SettingRow>

              <SettingRow
                label="End of Day Save Prompt"
                description="Prompt to save context at 5:30 PM"
              >
                <Switch checked={true} onCheckedChange={() => {}} />
              </SettingRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Engine</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingRow
                label="Proactive Suggestions"
                description="Show relevant saved resources while you work"
              >
                <Switch checked={true} onCheckedChange={() => {}} />
              </SettingRow>

              <SettingRow
                label="Liquid Scheduler"
                description="Auto-schedule learning content in calendar gaps"
              >
                <Switch checked={false} onCheckedChange={() => {}} />
              </SettingRow>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingRow
                label={
                  <span className="text-destructive font-medium">
                    Clear All Contexts
                  </span>
                }
                description="Delete all saved cognitive snapshots"
                className="border-destructive/10"
              >
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                >
                  Clear
                </Button>
              </SettingRow>

              <SettingRow
                label={
                  <span className="text-destructive font-medium">
                    Delete Account
                  </span>
                }
                description="Permanently delete your Lock In account"
                className="border-destructive/10"
              >
                <Button variant="destructive">Delete Account</Button>
              </SettingRow>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
