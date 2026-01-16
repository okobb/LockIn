import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Save,
  Globe,
  FileCode,
  GitBranch,
  Clock,
  Mic,
  Type,
  Cpu,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  X,
  Plus,
  Link as LinkIcon,
} from "lucide-react";
import { saveContextSnapshot } from "../api/saveContext";
import { startFocusSession } from "../../focus/api/focusApi";
import Sidebar from "../../../shared/components/Sidebar/Sidebar";
import { cn } from "../../../shared/lib/utils";
import { Button } from "../../../shared/components/UI/Button";
import { Card, CardContent } from "../../../shared/components/UI/Card";
import { Input } from "../../../shared/components/UI/Input";
import { Textarea } from "../../../shared/components/UI/Textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../shared/components/UI/Tabs";
import { Badge } from "../../../shared/components/UI/Badge";
import type { BrowserTab } from "../types";

type Tab = "voice" | "text" | "auto";

export const ContextSave = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("voice");
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [contextText, setContextText] = useState("");
  const [taskName, setTaskName] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const [gitState, setGitState] = useState<{
    branch: string;
    files_changed: string[];
    additions: number;
    deletions: number;
    repo: string;
  } | null>(null);
  const [timestamp] = useState(new Date());

  // Browser Tabs State
  const [extensionTabs, setExtensionTabs] = useState<BrowserTab[] | null>(null);
  const [manualUrls, setManualUrls] = useState<BrowserTab[]>([]);
  const [newUrlInput, setNewUrlInput] = useState("");

  // Voice Recording State
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const intervalRef = useRef<number | null>(null);

  // Initialize state from location
  useEffect(() => {
    if (location.state) {
      const state = location.state as {
        sessionId?: number;
        title?: string;
        note?: string;
        gitState?: any;
        initialTabs?: BrowserTab[];
      };
      if (state.note) setContextText(state.note);
      if (state.title) setTaskName(state.title);
      if (state.gitState) setGitState(state.gitState);
      if (state.initialTabs) {
        setManualUrls((prev) => {
          // Avoid duplicates based on URL
          const newTabs = state.initialTabs!.filter(
            (t) => !prev.some((p) => p.url === t.url)
          );
          return [...prev, ...newTabs];
        });
      }
    }
  }, [location.state]);

  useEffect(() => {
    const checkExtension = () => {
      if (window.lockInExtensionTabs) {
        setExtensionTabs(window.lockInExtensionTabs);
      }
    };

    checkExtension();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "LOCKIN_TABS") {
        setExtensionTabs(event.data.tabs);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioUrl]);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setTimer(0);
        // Clear previous recording
        setAudioBlob(null);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);

        intervalRef.current = window.setInterval(() => {
          setTimer((prev) => prev + 1);
        }, 1000);
      } catch (error) {
        console.error("Microphone access denied:", error);
        alert(
          "Could not access microphone. Please ensure you have granted permission."
        );
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const addManualUrl = () => {
    if (!newUrlInput.trim()) return;
    let url = newUrlInput.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    setManualUrls((prev) => [...prev, { title: url, url: url }]);
    setNewUrlInput("");
  };

  const removeManualUrl = (index: number) => {
    setManualUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const stopRecordingAndGetBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (
        !mediaRecorderRef.current ||
        mediaRecorderRef.current.state !== "recording"
      ) {
        resolve(audioBlob);
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;

      // We need to override the existing onstop temporarily or hook into it
      const originalOnStop = mediaRecorder.onstop;

      mediaRecorder.onstop = (e) => {
        // Run original handler to update state/UI if needed
        if (originalOnStop) {
          // @ts-ignore
          originalOnStop(e);
        }

        // Resolve with the new blob
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        resolve(blob);
      };

      mediaRecorder.stop();
      setIsRecording(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // If recording, stop and wait for blob
      let currentAudioBlob = audioBlob;
      if (isRecording) {
        currentAudioBlob = await stopRecordingAndGetBlob();
      }

      const locationState = location.state as {
        sessionId?: number;
        title?: string;
        note?: string;
      } | null;
      let sessionId = locationState?.sessionId;
      // Force new session if mode=start
      if (searchParams.get("mode") === "start") {
        sessionId = undefined;
      }

      if (!sessionId) {
        const stored = localStorage.getItem("current_focus_session");
        if (stored) {
          sessionId = JSON.parse(stored).sessionId;
        }
      }

      if (!sessionId) {
        if (!taskName.trim()) {
          alert("Please enter a task name to start a new session.");
          setIsSaving(false);
          return;
        }

        const sessionResponse = await startFocusSession({ title: taskName });
        // @ts-ignore
        sessionId = sessionResponse.id;

        // Update local storage so we stick to this session
        localStorage.setItem(
          "current_focus_session",
          JSON.stringify({
            sessionId: sessionResponse.id,
            taskId: sessionResponse.task_id,
            title: sessionResponse.title,
            startTime: new Date().toISOString(),
            isFreestyle: false,
          })
        );
      }

      const allTabs = [...(extensionTabs || []), ...manualUrls];

      let voiceFile: File | undefined;
      if (currentAudioBlob && currentAudioBlob.size > 0) {
        voiceFile = new File([currentAudioBlob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });
      }

      await saveContextSnapshot({
        focus_session_id: sessionId!,
        note: contextText || locationState?.note,
        browser_state: allTabs.length > 0 ? allTabs : undefined,
        git_state: gitState || undefined,
        voice_file: voiceFile,
      });

      setIsSuccess(true);
      setTimeout(() => {
        // If we started a new session, go to focus mode
        navigate("/focus", {
          state: {
            sessionId: sessionId,
            title: taskName || locationState?.title,
            taskId: undefined, // check if we have it from response
          },
        });
      }, 1500);
    } catch (error: any) {
      console.error("Failed to save/start context", error);
      let errorMessage = "Failed to save context.";

      if (error.response) {
        if (error.response.data.errors) {
          errorMessage +=
            "\n" + Object.values(error.response.data.errors).flat().join("\n");
        } else if (error.response.data.message) {
          errorMessage += "\n" + error.response.data.message;
        }
      } else if (error.message) {
        errorMessage += "\n" + error.message;
      }

      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const totalTabs = (extensionTabs?.length || 0) + manualUrls.length;
  const isStartMode =
    !(
      (location.state as any)?.sessionId ||
      localStorage.getItem("current_focus_session")
    ) || searchParams.get("mode") === "start";

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main
        className={cn(
          "flex-1 flex flex-col h-screen w-full transition-all duration-300 relative overflow-hidden",
          isSidebarCollapsed ? "pl-[64px]" : "pl-[260px]"
        )}
      >
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl opacity-50" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl opacity-50" />
        </div>

        <div className="flex-1 w-full overflow-y-auto custom-scrollbar">
          <div className="min-h-full flex flex-col items-center justify-center p-6 py-12">
            <Card className="w-full max-w-3xl bg-card/60 backdrop-blur-xl border-border/50 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary to-transparent opacity-50" />

              <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-light tracking-tight flex items-center gap-2">
                      <Save className="w-6 h-6 text-primary" />
                      {!isStartMode ? "Lock In Context" : "Start Focus Session"}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {!isStartMode
                        ? "Save your mental state before you step away."
                        : "Configure your context and ready your workspace."}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="rounded-full hover:bg-muted"
                  >
                    <ArrowLeft className="w-5 h-5 opacity-70" />
                  </Button>
                </div>

                <div
                  className={cn(
                    "grid gap-4",
                    isStartMode ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"
                  )}
                >
                  <div className="p-3 rounded-lg bg-background/50 border border-border/50 flex flex-col gap-1 items-center text-center hover:border-primary/20 transition-colors">
                    <Globe className="w-4 h-4 text-primary mb-1" />
                    <span className="text-sm font-medium">
                      {totalTabs} Tabs
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Browser
                    </span>
                  </div>

                  {!isStartMode && (
                    <>
                      <div className="p-3 rounded-lg bg-background/50 border border-border/50 flex flex-col gap-1 items-center text-center hover:border-primary/20 transition-colors">
                        <FileCode
                          className={cn(
                            "w-4 h-4 mb-1",
                            gitState
                              ? "text-amber-400"
                              : "text-muted-foreground"
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            !gitState && "text-muted-foreground"
                          )}
                        >
                          {gitState
                            ? `${gitState.files_changed?.length || 0} Files`
                            : "No Changes"}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Pending
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 border border-border/50 flex flex-col gap-1 items-center text-center hover:border-primary/20 transition-colors">
                        <GitBranch
                          className={cn(
                            "w-4 h-4 mb-1",
                            gitState
                              ? "text-purple-400"
                              : "text-muted-foreground"
                          )}
                        />
                        {gitState ? (
                          <span
                            className="text-xs font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full truncate max-w-[100px]"
                            title={gitState?.branch}
                          >
                            {gitState.branch}
                          </span>
                        ) : (
                          <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            Local Task
                          </span>
                        )}

                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                          Branch
                        </span>
                      </div>
                    </>
                  )}

                  <div className="p-3 rounded-lg bg-background/50 border border-border/50 flex flex-col gap-1 items-center text-center hover:border-primary/20 transition-colors">
                    <Clock className="w-4 h-4 text-emerald-400 mb-1" />
                    <span className="text-sm font-medium">
                      {timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Timestamp
                    </span>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-border/40 bg-background/30 p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Connected Context
                    </label>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {extensionTabs ? "Extension Connected" : "Manual Mode"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a relevant URL (e.g., Pull Request, Documentation...)"
                      value={newUrlInput}
                      onChange={(e) => setNewUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addManualUrl()}
                      className="flex-1 bg-background/50 h-9 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={addManualUrl}
                      disabled={!newUrlInput.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                    {extensionTabs?.map((tab, i) => (
                      <div
                        key={`ext-${i}`}
                        className="flex items-center justify-between p-2 rounded bg-background/50 border border-border/30 text-xs group hover:border-primary/20 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-2">
                          <Globe className="w-3 h-3 text-primary shrink-0" />
                          <span
                            className="truncate font-medium shrink-0 max-w-[150px]"
                            title={tab.title}
                          >
                            {tab.title || "Untitled"}
                          </span>
                          <span
                            className="truncate text-muted-foreground opacity-60"
                            title={tab.url}
                          >
                            {tab.url}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4 px-1 opacity-50"
                          >
                            EXT
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400 rounded-full"
                            onClick={() =>
                              setExtensionTabs(
                                (prev) =>
                                  prev?.filter((_, idx) => idx !== i) || []
                              )
                            }
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {manualUrls.map((tab, i) => (
                      <div
                        key={`manual-${i}`}
                        className="flex items-center justify-between p-2 rounded bg-background/50 border border-border/30 text-xs group hover:border-primary/20 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-2">
                          <LinkIcon className="w-3 h-3 text-amber-500 shrink-0" />
                          <span
                            className="truncate font-medium shrink-0 max-w-[150px]"
                            title={tab.title || tab.url}
                          >
                            {tab.title || "Link"}
                          </span>
                          <span
                            className="truncate text-muted-foreground opacity-60"
                            title={tab.url}
                          >
                            {tab.url}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400 rounded-full"
                          onClick={() => removeManualUrl(i)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {!extensionTabs && manualUrls.length === 0 && (
                      <div className="text-center text-muted-foreground text-xs py-2 italic opacity-60">
                        No URLs added yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                    Task Definition
                  </label>
                  <Input
                    placeholder="What are you working on? (Optional)"
                    className="bg-background/50 h-10 border-muted group-hover:border-primary/50 transition-colors"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                  />
                </div>

                {!isStartMode && (
                  <Tabs
                    defaultValue="voice"
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as Tab)}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3 bg-muted/40 p-1">
                      <TabsTrigger value="voice" className="gap-2">
                        <Mic className="w-4 h-4" /> Voice Note
                      </TabsTrigger>
                      <TabsTrigger value="text" className="gap-2">
                        <Type className="w-4 h-4" /> Text Note
                      </TabsTrigger>
                      <TabsTrigger value="auto" className="gap-2">
                        <Cpu className="w-4 h-4" /> Auto-Generate
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent
                      value="voice"
                      className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      <div
                        className={cn(
                          "rounded-xl border-2 border-dashed border-border p-8 flex flex-col items-center justify-center gap-4 transition-all duration-300 relative overflow-hidden",
                          isRecording && "border-red-500/50 bg-red-500/5"
                        )}
                      >
                        <div
                          className={cn(
                            "text-4xl font-mono tabular-nums tracking-tighter transition-all z-10",
                            isRecording
                              ? "text-red-500 scale-110"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatTime(timer)}
                        </div>

                        {isRecording && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                            <div className="w-32 h-32 bg-red-500 rounded-full animate-ping" />
                          </div>
                        )}

                        <Button
                          size="lg"
                          className={cn(
                            "rounded-full w-16 h-16 shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center relative z-20",
                            isRecording
                              ? "bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white"
                              : "bg-primary hover:bg-primary/90 shadow-primary/25 text-white"
                          )}
                          onClick={toggleRecording}
                        >
                          {isRecording ? (
                            <div
                              className="w-6 h-6 bg-white rounded-sm shrink-0"
                              style={{ minWidth: "24px", minHeight: "24px" }}
                            />
                          ) : (
                            <Mic
                              className="w-8 h-8 text-white shrink-0"
                              strokeWidth={2.5}
                              style={{ minWidth: "32px", minHeight: "32px" }}
                            />
                          )}
                        </Button>
                        <p className="text-sm text-muted-foreground font-medium z-10">
                          {isRecording
                            ? "Recording your thought process..."
                            : audioUrl
                            ? "Recording saved! Tap mic to re-record."
                            : "Tap to start recording"}
                        </p>

                        {audioUrl && !isRecording && (
                          <div className="w-full max-w-sm mt-2 z-10 animate-in fade-in slide-in-from-bottom-2">
                            <audio
                              src={audioUrl}
                              controls
                              className="w-full h-8"
                            />
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="text"
                      className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      <Textarea
                        placeholder="I was in the middle of debugging the token refresh logic. The expiration check seems off..."
                        className="min-h-[200px] resize-none bg-background/50 text-base leading-relaxed p-4"
                        value={contextText}
                        onChange={(e) => setContextText(e.target.value)}
                      />
                    </TabsContent>

                    <TabsContent
                      value="auto"
                      className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      <div className="rounded-xl border border-border/50 bg-background/30 p-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <Cpu className="w-8 h-8 text-primary" />
                        </div>
                        <h4 className="text-lg font-medium">
                          AI Context Generation
                        </h4>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                          Lock In will analyze your code changes, open tabs, and
                          recent terminal output to generate a summary
                          automatically.
                        </p>
                        <Badge
                          variant="secondary"
                          className="bg-primary/5 text-primary border-primary/20"
                        >
                          Takes ~5-10 seconds
                        </Badge>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                <div className="pt-4 flex items-center justify-end gap-3">
                  <Button variant="ghost" onClick={() => navigate(-1)}>
                    Cancel
                  </Button>
                  {isSuccess ? (
                    <Button
                      className="bg-emerald-500 text-white hover:bg-emerald-600 px-8 disabled:opacity-100"
                      disabled
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Saved
                      Successfully!
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-8 shadow-lg shadow-primary/20"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                          Saving Context...
                        </>
                      ) : (
                        <>
                          {activeTab === "voice" ? (
                            <Mic className="w-4 h-4 mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}{" "}
                          {!isStartMode ? "Lock In Context" : "Start Focus"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
