import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarRange,
  Map,
  History,
  BarChart2,
  BookOpen,
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../../features/auth/hooks/useAuth";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hideToggle?: boolean;
}

const navSections: NavSection[] = [
  {
    label: "Planning",
    items: [
      {
        to: "/weekly-planner",
        icon: CalendarRange,
        label: "Weekly Planner",
      },
    ],
  },
  {
    label: "Main",
    items: [
      { to: "/dashboard", icon: Map, label: "Daily Map" },
      {
        to: "/context-history",
        icon: History,
        label: "Context History",
      },
      { to: "/stats", icon: BarChart2, label: "Stats" },
    ],
  },
  {
    label: "Knowledge",
    items: [{ to: "/resources", icon: BookOpen, label: "Resource Hub" }],
  },
];

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  hideToggle,
}: SidebarProps) {
  const location = useLocation();
  const [isDarkTheme, setIsDarkTheme] = React.useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      return saved ? saved === "dark" : true;
    }
    return true;
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  /* Effect to sync theme with DOM on mount and updates */
  React.useEffect(() => {
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "group/sidebar fixed left-0 top-0 z-40 h-screen flex flex-col bg-card/95 backdrop-blur-md border-r border-border/40 transition-all duration-300 ease-in-out font-sans",
        isCollapsed ? "w-[70px]" : "w-[260px]",
      )}
    >
      <div className="flex h-16 items-center shrink-0 px-4 border-b border-border/40 relative">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 transition-all duration-300 overflow-hidden",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100",
          )}
        >
          <img
            src="/Project logo.png"
            alt="Lock In"
            className="h-8 w-8 rounded-lg object-contain"
          />
          <span className="text-lg font-semibold tracking-tight text-foreground whitespace-nowrap">
            Lock In
          </span>
        </Link>

        {!hideToggle && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              "absolute flex h-6 w-6 items-center justify-center text-muted-foreground/70 hover:text-foreground transition-all duration-300 z-50",
              isCollapsed
                ? "left-1/2 -translate-x-1/2 top-4"
                : "right-3 top-1/2 -translate-y-1/2",
            )}
          >
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8 scrollbar-hide">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-2">
            {!isCollapsed && (
              <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 transition-opacity duration-300">
                {section.label}
              </h4>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none overflow-hidden",
                      isActive
                        ? "text-primary bg-primary/5"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      isCollapsed && "justify-center px-2",
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                    )}

                    <item.icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors z-10",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {!isCollapsed && (
                      <span className="truncate z-10 transition-transform duration-200 group-hover:translate-x-1">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border/40 p-3 relative">
        {isProfileOpen && !isCollapsed && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl bg-popover border border-border/50 shadow-xl shadow-black/20 p-1.5 animate-in slide-in-from-bottom-2 fade-in duration-200 overflow-hidden z-50">
            <Link
              to="/settings"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setIsProfileOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
            >
              {isDarkTheme ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
              {isDarkTheme ? "Light Mode" : "Dark Mode"}
            </button>
            <div className="h-px bg-border/50 my-1" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        )}

        <button
          onClick={() => !isCollapsed && setIsProfileOpen(!isProfileOpen)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl p-2 transition-all duration-200 outline-none",
            isProfileOpen && !isCollapsed
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50",
            isCollapsed ? "justify-center" : "justify-start",
          )}
        >
          <div className="h-9 w-9 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/20 shrink-0">
            {user?.name ? (
              user.name.charAt(0).toUpperCase()
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </div>

          {!isCollapsed && (
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name || "Guest User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || "Sign in to sync"}
              </p>
            </div>
          )}

          {isCollapsed && <div className="sr-only">Profile</div>}
        </button>
      </div>
    </aside>
  );
}
