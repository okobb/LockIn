import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  Zap,
  RotateCcw,
  Layout,
  Brain,
  ArrowRight,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "../../../shared/components/UI/Button";
import { useState, useEffect } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      return saved ? saved === "dark" : true;
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkTheme) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-60 animate-pulse" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] opacity-40" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/Project logo.png"
              alt="Lock In"
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="text-xl font-bold tracking-tight">Lock In</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title={
                isDarkTheme ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDarkTheme ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <Link
              to="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log In
            </Link>
            <Button
              onClick={() => navigate("/signup")}
              className="shadow-lg shadow-primary/20"
            >
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isDarkTheme ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              className="p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background px-4 py-4 space-y-4 animate-in slide-in-from-top-5">
            <Link
              to="/login"
              className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2"
            >
              Log In
            </Link>
            <Button onClick={() => navigate("/signup")} className="w-full">
              Get Started
            </Button>
          </div>
        )}
      </nav>

      <main className="flex-1 relative z-10 w-full max-w-[1400px] mx-auto">
        {/* Hero Section */}
        <section className="pt-20 pb-16 md:pt-32 md:pb-24 px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-tight md:leading-[1.1]">
            Stop Drowning in <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-primary-light to-secondary-foreground animate-gradient">
              Context Switches
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            The AI-powered cognitive command center for developers. Turn context
            switching from a 20-minute drain into a 2-minute restore.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <Button
              size="lg"
              className="h-12 px-8 text-base rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1"
              onClick={() => navigate("/signup")}
            >
              Start Free Trial <Zap className="w-4 h-4 ml-2 fill-current" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-12 px-8 text-base rounded-full border border-border/50 hover:bg-muted"
              onClick={() =>
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              How it works
            </Button>
          </div>

          {/* Stats Row */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto px-4">
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-xs hover:border-primary/20 transition-colors">
              <div className="text-4xl font-mono font-bold text-foreground mb-1">
                30+
              </div>
              <div className="text-sm text-muted-foreground">
                Minutes saved daily
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-xs hover:border-primary/20 transition-colors">
              <div className="text-4xl font-mono font-bold text-foreground mb-1">
                2min
              </div>
              <div className="text-sm text-muted-foreground">
                Context restore time
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-xs hover:border-primary/20 transition-colors">
              <div className="text-4xl font-mono font-bold text-foreground mb-1">
                3x
              </div>
              <div className="text-sm text-muted-foreground">
                Deeper focus sessions
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 md:px-6 border-t border-border/40 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Reclaim Your Cognitive State
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Developers lose significant time daily to productivity killers.
                We solved them.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="group p-8 rounded-3xl bg-card border border-border/50 shadow-xs hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Layout className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Unified Briefing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Wake up to exactly what needs your attention. AI filters Slack
                  messages down to the blocking tasks that actually matter.
                </p>
              </div>

              <div className="group p-8 rounded-3xl bg-card border border-border/50 shadow-xs hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Context Restoration
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Save your mental state with voice memos and git diffs. Resume
                  deep work instantly with an AI-generated checklist.
                </p>
              </div>

              <div className="group p-8 rounded-3xl bg-card border border-border/50 shadow-xs hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Proactive Knowledge
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Stop Googling the same thing twice. Your "Senior Engineer" AI
                  surfaces saved articles exactly when you need them.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-4 md:px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Three steps to reclaim your focus
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-0.5 bg-linear-to-r from-transparent via-border to-transparent -z-10" />

              <div className="text-center relative bg-background p-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-card border border-border flex items-center justify-center text-xl font-mono font-bold text-primary mb-6 shadow-xs relative z-10">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Connect Your Tools
                </h3>
                <p className="text-sm text-muted-foreground">
                  Link Slack, GitHub, and Calendar. We'll start learning your
                  workflow immediately.
                </p>
              </div>

              <div className="text-center relative bg-background p-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-card border border-border flex items-center justify-center text-xl font-mono font-bold text-primary mb-6 shadow-xs relative z-10">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Lock In Before Switching
                </h3>
                <p className="text-sm text-muted-foreground">
                  Record a 30-second voice note before interruptions. We capture
                  your context.
                </p>
              </div>

              <div className="text-center relative bg-background p-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-card border border-border flex items-center justify-center text-xl font-mono font-bold text-primary mb-6 shadow-xs relative z-10">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Resume in Minutes
                </h3>
                <p className="text-sm text-muted-foreground">
                  AI restores your tabs, files, and generates a checklist to get
                  you back in flow instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="rounded-[2.5rem] bg-linear-to-b from-card to-background border border-primary/20 p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
              {/* Abstract decoration */}
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary to-transparent opacity-50" />
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-[80px]" />

              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                Ready to stop context switching?
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                Join developers who are shipping faster with Lock In.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  size="lg"
                  className="h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/25 hover:shadow-primary/40"
                  onClick={() => navigate("/signup")}
                >
                  Start Free Trial
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-10 text-lg rounded-full"
                  onClick={() => navigate("/login")}
                >
                  View Demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-6 bg-muted/10">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex items-center justify-center gap-2 mb-6 opacity-80 hover:opacity-100 transition-opacity">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg">Lock In</span>
          </div>
          <p className="text-muted-foreground text-sm mb-8">
            Built for developers who want to ship, not scroll.
          </p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground mb-8">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy
            </a>
            <span className="opacity-30">•</span>
            <a href="#" className="hover:text-primary transition-colors">
              Terms
            </a>
            <span className="opacity-30">•</span>
            <a href="#" className="hover:text-primary transition-colors">
              GitHub
            </a>
            <span className="opacity-30">•</span>
            <a href="#" className="hover:text-primary transition-colors">
              Twitter
            </a>
          </div>
          <p className="text-xs text-muted-foreground/60">
            © 2026 Lock In Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
