import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Lock,
  CalendarRange,
  Map,
  Target,
  History,
  BarChart2,
  BookOpen,
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./Sidebar.css";

interface NavItem {
  to: string;
  icon: React.ReactNode;
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
}

const navSections: NavSection[] = [
  {
    label: "Planning",
    items: [
      {
        to: "/weekly-planner",
        icon: <CalendarRange size={18} />,
        label: "Weekly Planner",
      },
    ],
  },
  {
    label: "Main",
    items: [
      { to: "/dashboard", icon: <Map size={18} />, label: "Daily Map" },
      { to: "/focus", icon: <Target size={18} />, label: "Focus Mode" },
      {
        to: "/context-history",
        icon: <History size={18} />,
        label: "Context History",
        badge: 3,
      },
      { to: "/stats", icon: <BarChart2 size={18} />, label: "Stats" },
    ],
  },
  {
    label: "Knowledge",
    items: [{ to: "/library", icon: <BookOpen size={18} />, label: "Library" }],
  },
];

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const location = useLocation();
  const [isDarkTheme, setIsDarkTheme] = React.useState(true);

  const toggleTheme = () => {
    const newTheme = isDarkTheme ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    setIsDarkTheme(!isDarkTheme);
  };

  const getShortcutKey = () => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    return isMac ? "⌘K" : "Ctrl+K";
  };

  const navigate = useNavigate();

  const handleLockIn = () => {
    navigate("/context-save");
  };

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Collapse Toggle */}
      <button
        className="sidebar-toggle"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <Link to="/" className="sidebar-logo">
        <img src="/Project logo.png" alt="Lock In" />
        <span className="sidebar-logo-text">Lock In</span>
      </Link>

      {/* Search Trigger */}
      <button className="search-trigger">
        <Search className="icon" />
        <span>Search...</span>
        <kbd className="kbd">{getShortcutKey()}</kbd>
      </button>

      {/* Lock In CTA */}
      <button className="lock-in-cta" onClick={handleLockIn}>
        <Lock className="icon" />
        <span>Lock In</span>
      </button>

      {/* Navigation */}
      <nav>
        {navSections.map((section) => (
          <div className="nav-section" key={section.label}>
            <div className="nav-label">{section.label}</div>
            {section.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-link ${
                  location.pathname === item.to ? "active" : ""
                }`}
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer with Settings & Theme */}
      <div className="sidebar-footer">
        <Link
          to="/settings"
          className={`nav-link ${
            location.pathname === "/settings" ? "active" : ""
          }`}
        >
          <Settings className="icon" size={18} />
          <span>Settings</span>
        </Link>
        <button className="theme-toggle-sidebar" onClick={toggleTheme}>
          {isDarkTheme ? <Sun className="icon" /> : <Moon className="icon" />}
          <span>Toggle Theme</span>
        </button>
        <div className="sidebar-footer-divider" />
        <div className="sidebar-footer-text">Free Plan</div>
        <a href="#" className="upgrade-link">
          Upgrade to Pro →
        </a>
      </div>
    </aside>
  );
}
