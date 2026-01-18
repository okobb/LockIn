import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Layout,
  RotateCcw,
  Brain,
  Puzzle,
  Check,
  CheckCircle2,
  Mic,
  Layers,
  Loader2,
} from "lucide-react";
import { Button } from "../../../shared/components/UI/Button";
import { Card } from "../../../shared/components/UI/Card";
import { cn } from "../../../shared/lib/utils";
import { useIntegrations } from "../../settings/hooks/useIntegrations";
import { useModal } from "../../../shared/context/ModalContext";

// Custom SVG Icons
const GitHubIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const GoogleIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
  </svg>
);

const SlackIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52h-2.52zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.52v-2.52zM17.688 8.834a2.528 2.528 0 0 1-2.522 2.521 2.528 2.528 0 0 1-2.522-2.521V2.522A2.528 2.528 0 0 1 15.166 0a2.528 2.528 0 0 1 2.522 2.522v6.312zM15.166 18.956a2.528 2.528 0 0 1 2.522 2.521A2.528 2.528 0 0 1 15.166 24a2.528 2.528 0 0 1-2.522-2.522v-2.52h2.52zM15.166 17.688a2.527 2.527 0 0 1-2.522-2.521 2.527 2.527 0 0 1 2.522-2.521h6.312A2.527 2.527 0 0 1 24 15.165a2.527 2.527 0 0 1-2.522 2.521h-6.312z" />
  </svg>
);

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const { open: openModal } = useModal();
  
  const {
    isConnected,
    connect,
    connectingKey,
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

  // Initialize theme from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      const isDark = saved ? saved === "dark" : true;
      const root = document.documentElement;
      if (isDark) {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
      }
    }
  }, []);

  const progress = (currentStep / totalSteps) * 100;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((curr) => curr + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((curr) => curr - 1);
    }
  };

  const handleComplete = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground font-sans">
      <div className="w-full max-w-3xl space-y-8">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
                <img
                  src="/Project logo.png"
                  alt="Lock In"
                  className="h-10 w-auto"
                />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Your Cognitive Command Center
              </h1>
              <p className="text-lg text-muted-foreground">
                Stop context switching. Start shipping.
              </p>
            </div>

            <div className="grid gap-4">
              <FeatureCard
                icon={Layout}
                title="Daily Briefing"
                description="AI filters dozens of messages down to the few that actually need your attention. Start each day with clarity."
              />
              <FeatureCard
                icon={RotateCcw}
                title="Context Preservation"
                description="Save your mental state before interruptions. Resume in minutes with AI-generated action items."
                iconColor="text-emerald-500"
                bgColor="bg-emerald-500/10"
              />
              <FeatureCard
                icon={Brain}
                title="Knowledge Surfacing"
                description="Your saved resources appear exactly when relevant. Stop searching for solutions you've already found."
                iconColor="text-indigo-500"
                bgColor="bg-indigo-500/10"
              />
            </div>

            <Button
              size="lg"
              className="w-full h-12 text-base md:w-auto md:min-w-[200px] md:mx-auto md:flex"
              onClick={nextStep}
            >
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Connect Integrations */}
        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="text-center md:text-left space-y-2">
              <div className="text-sm font-semibold text-primary uppercase tracking-wider">
                Step 1 of 3
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Connect Your Tools
              </h1>
              <p className="text-muted-foreground">
                Link your workspace to enable intelligent briefings
              </p>
            </div>

            <div className="grid gap-4">
              <IntegrationCard
                icon={SlackIcon}
                title="Slack"
                description="Parse messages and identify urgent items"
                color="#E01E5A"
                isConnected={isConnected("slack", "notifications")}
                onConnect={() => connect("slack", "notifications")}
                isConnecting={connectingKey === "slack-notifications"}
              />
              <IntegrationCard
                icon={GitHubIcon}
                title="GitHub"
                description="Track code changes, PRs, and reviews"
                color="currentColor"
                isConnected={isConnected("github", "repos")}
                onConnect={() => connect("github", "repos")}
                isConnecting={connectingKey === "github-repos"}
              />
              <IntegrationCard
                icon={GoogleIcon}
                title="Google Calendar"
                description="Auto-save context before meetings"
                color="#4285f4"
                isConnected={isConnected("google", "workspace")}
                onConnect={() => connect("google", "workspace")}
                isConnecting={connectingKey === "google-workspace"}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
              <Button variant="ghost" onClick={prevStep}>
                <ArrowLeft className="mr-2 w-4 h-4" /> Back
              </Button>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={nextStep}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto sm:ml-0 order-2 sm:order-1"
                >
                  Skip for now
                </button>
                <Button
                  onClick={nextStep}
                  className="order-1 sm:order-2 w-full sm:w-auto"
                >
                  Continue <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Install Extension */}
        {currentStep === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="text-center md:text-left space-y-2">
              <div className="text-sm font-semibold text-primary uppercase tracking-wider">
                Step 2 of 3
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Install Browser Extension
              </h1>
              <p className="text-muted-foreground">
                Required for context saving and proactive suggestions
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border/50 text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Puzzle className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Lock In Extension</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Capture browser tabs, monitor work sessions, and save contexts
                  instantly
                </p>
              </div>
              <Button className="mx-auto" size="lg">
                Add to Chrome
              </Button>
            </div>

            <div className="space-y-3">
              <ChecklistItem
                number={1}
                title="Save Browser Context"
                description="One-click to capture all tabs and restore them later"
                completed
              />
              <ChecklistItem
                number={2}
                title="Proactive Suggestions"
                description="Get notified when saved resources match your current work"
              />
              <ChecklistItem
                number={3}
                title="Focus Mode Protection"
                description="Block non-urgent notifications during deep work sessions"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
              <Button variant="ghost" onClick={prevStep}>
                <ArrowLeft className="mr-2 w-4 h-4" /> Back
              </Button>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={nextStep}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto sm:ml-0 order-2 sm:order-1"
                >
                  Skip for now
                </button>
                <Button
                  onClick={nextStep}
                  className="order-1 sm:order-2 w-full sm:w-auto"
                >
                  Continue <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {currentStep === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="text-center md:text-left space-y-2">
              <div className="text-sm font-semibold text-primary uppercase tracking-wider">
                Step 3 of 3
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                You're All Set
              </h1>
              <p className="text-muted-foreground">
                Save your first context and experience instant restoration
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border/50 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Setup Complete</h3>
                <p className="text-sm text-muted-foreground">
                  Click the Lock In extension icon in your toolbar to save your
                  first context
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <FeatureCard
                icon={Mic}
                title="Record Voice Memos"
                description="Capture your thoughts in 30 seconds to restore context faster"
              />
              <FeatureCard
                icon={Layers}
                title="Automatic Capture"
                description="Open tabs, git changes, and AI-generated next steps are saved automatically"
                iconColor="text-amber-500"
                bgColor="bg-amber-500/10"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
              <Button variant="ghost" onClick={prevStep}>
                <ArrowLeft className="mr-2 w-4 h-4" /> Back
              </Button>
              <Button
                onClick={handleComplete}
                size="lg"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
              >
                Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  iconColor = "text-primary",
  bgColor = "bg-primary/10",
}: any) {
  return (
    <Card className="p-4 flex items-start gap-4 hover:border-primary/20 transition-colors">
      <div className={cn("p-2.5 rounded-lg shrink-0", bgColor, iconColor)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </Card>
  );
}

function IntegrationCard({
  icon: Icon,
  title,
  description,
  color,
  isConnected,
  onConnect,
  isConnecting,
}: any) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-4 hover:border-primary/20 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Icon width={24} height={24} style={{ color }} />
        </div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {isConnected ? (
        <Button
          variant="outline"
          size="sm"
          className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
          disabled
        >
          <Check className="w-4 h-4 mr-1" /> Connected
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Connecting...
            </>
          ) : (
            "Connect"
          )}
        </Button>
      )}
    </div>
  );
}

function ChecklistItem({ number, title, description, completed }: any) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card flex items-start gap-4">
      {completed ? (
        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
          <Check className="w-4 h-4" />
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full bg-secondary text-muted-foreground text-sm font-semibold flex items-center justify-center shrink-0">
          {number}
        </div>
      )}
      <div>
        <h3 className="font-medium text-sm mb-0.5">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
