import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  RotateCcw,
  Inbox,
  Clock,
  ArrowRight,
  CalendarRange,
} from "lucide-react";
import Sidebar from "../../../../shared/components/Sidebar/Sidebar";
import { useDashboard } from "../../hooks/useDashboard";
import "./Dashboard.css";

import MissionBar from "../../components/MissionBar/MissionBar";

export default function Dashboard() {
  const { stats, priorityTasks, upcomingEvents, communications } =
    useDashboard();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Format current date
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "short",
      day: "numeric",
    };
    return new Date().toLocaleDateString("en-US", options);
  };

  // Get current time
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main
        className={`main-content ${
          isSidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        {/* Header */}
        <header className="page-header">
          <h1 className="greeting">{getGreeting()}</h1>
          <p className="date-info">
            {formatDate()} •{" "}
            {priorityTasks.length > 0 ? (
              <strong>{priorityTasks.length} priority items</strong>
            ) : (
              "No priority items"
            )}
          </p>
        </header>

        {/* Stats Bar */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{stats.flowTime}</span>
            <span className="stat-label">Flow Time</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.contextsSaved}</span>
            <span className="stat-label">Contexts Saved</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.deepWorkBlocks}</span>
            <span className="stat-label">Deep Work Blocks</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.tasksDone}</span>
            <span className="stat-label">Tasks Done</span>
          </div>
          <Link to="/stats" className="stats-link">
            View Stats <ArrowRight size={14} />
          </Link>
        </div>

        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="main-column">
            {/* Mission Bar */}
            <MissionBar />

            {/* Priority Tasks */}
            <div className="dashboard-card">
              <div className="card-title">
                <AlertCircle size={14} />
                Priority Tasks
              </div>

              {priorityTasks.length === 0 ? (
                <div className="empty-state">
                  <AlertCircle className="icon" />
                  <div className="empty-state-title">No priority tasks</div>
                  <div className="empty-state-text">
                    Tasks requiring immediate attention will appear here
                  </div>
                </div>
              ) : (
                <div className="task-list">
                  {priorityTasks.map((task) => (
                    <div key={task.id} className="task-item">
                      <div className="task-item-header">
                        <span className={`task-tag ${task.tagColor}`}>
                          {task.tag}
                        </span>
                        <span className="task-time">{task.timeAgo}</span>
                      </div>
                      <div className="task-title">{task.title}</div>
                      {task.reference && (
                        <div className="task-reference">{task.reference}</div>
                      )}
                      <div className="task-reason">{task.reason}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Context Restoration */}
            <div className="dashboard-card">
              <div className="card-title">
                <RotateCcw size={14} />
                Context Restoration
              </div>

              <div className="empty-state">
                <RotateCcw className="icon" />
                <div className="empty-state-title">No saved context</div>
                <div className="empty-state-text">
                  Lock In to save your work context for later
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="sidebar-column">
            {/* Communications Hub */}
            <div className="comm-hub">
              <div className="comm-hub-header">
                <div className="card-title">
                  <Inbox size={14} />
                  Communications
                </div>
                <span className="comm-count">{communications.length} new</span>
              </div>

              <div className="comm-tabs">
                <button className="comm-tab active">
                  {/* Slack Icon */}
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    width={14}
                    height={14}
                    fill="currentColor"
                  >
                    <title>Slack</title>
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                  </svg>
                  Slack
                </button>
                <button className="comm-tab">
                  {/* GitHub Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <title>GitHub</title>
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  PRs
                </button>
                <button className="comm-tab">
                  {/* Gmail Icon */}
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    width={14}
                    height={14}
                    fill="currentColor"
                  >
                    <title>Gmail</title>
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                  </svg>
                  Email
                </button>
              </div>

              <div className="empty-state">
                <Inbox className="icon" />
                <div className="empty-state-title">No messages</div>
                <div className="empty-state-text">
                  Connect your integrations to see messages
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="upcoming-widget">
              <div className="upcoming-header">
                <div className="card-title">
                  <Clock size={14} />
                  Upcoming
                </div>
                <span className="current-time">{getCurrentTime()}</span>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="empty-state">
                  <CalendarRange className="icon" />
                  <div className="empty-state-title">No upcoming events</div>
                  <div className="empty-state-text">
                    Connect your calendar to see events
                  </div>
                </div>
              ) : (
                <div className="upcoming-list">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`upcoming-item ${event.type}`}
                    >
                      <span className="upcoming-time">{event.time}</span>
                      <div className="upcoming-info">
                        <div className="upcoming-title">{event.title}</div>
                        <div className="upcoming-meta">{event.meta}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link
                to="/weekly-planner"
                className="btn btn-ghost"
                style={{ width: "100%", marginTop: "var(--space-3)" }}
              >
                <CalendarRange size={16} />
                View Full Schedule
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
