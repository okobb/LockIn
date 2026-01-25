import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Save, ExternalLink, X, AlertCircle } from "lucide-react";
import "../shared/styles/global.css";
import "./popup.css";

interface TabData {
  id?: number;
  title?: string;
  url?: string;
  favIconUrl?: string;
}

// eslint-disable-next-line react-refresh/only-export-components
const Popup = () => {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyTheme(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => applyTheme(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    // Fetch all tabs in the current window
    chrome.tabs.query({ currentWindow: true }, (result) => {
      setTabs(result);
    });

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleSaveContext = () => {
    const targetUrl = "http://localhost:5173/context-save?mode=start";

    chrome.tabs.create({ url: targetUrl }, (tab) => {
      if (chrome.runtime.lastError) {
        setError(`Failed to open LockIn: ${chrome.runtime.lastError.message}`);
        return;
      }

      if (tab.id) {
        const tabId = tab.id;
        const tabsData = tabs;

        const listener = (tid: number, changeInfo: any) => {
          if (tid === tabId && changeInfo.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);

            chrome.scripting.executeScript(
              {
                target: { tabId },
                world: "MAIN",
                func: (data) => {
                  // @ts-ignore
                  window.lockInExtensionTabs = data;
                  window.postMessage({ type: "LOCKIN_TABS", tabs: data }, "*");

                  let retries = 0;
                  const interval = setInterval(() => {
                    window.postMessage(
                      { type: "LOCKIN_TABS", tabs: data },
                      "*",
                    );
                    retries++;
                    if (retries > 5) clearInterval(interval);
                  }, 500);
                },
                args: [tabsData],
              },
              () => {
                if (chrome.runtime.lastError) {
                  console.error(
                    "Script injection failed",
                    chrome.runtime.lastError,
                  );
                }
              },
            );
          }
        };

        chrome.tabs.onUpdated.addListener(listener);
      }
    });
  };

  const removeTab = (tabId: number) => {
    setTabs(tabs.filter((t) => t.id !== tabId));
  };

  return (
    <div className="w-full h-full p-3 bg-background text-foreground flex flex-col font-sans">
      <header className="flex items-center justify-between mb-3 border-b border-border pb-2">
        <h1 className="text-base font-semibold flex items-center gap-2">
          <Save className="w-4 h-4 text-primary" />
          Context Saver
        </h1>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/50">
          {tabs.length} Tabs
        </span>
      </header>

      {error && (
        <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-xs flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-destructive hover:text-destructive/80 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-1 mb-3 flex-1 overflow-y-auto pr-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className="group flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
          >
            {tab.favIconUrl ? (
              <img
                src={tab.favIconUrl}
                alt=""
                className="w-3.5 h-3.5 opacity-80"
              />
            ) : (
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium truncate leading-tight"
                title={tab.title}
              >
                {tab.title}
              </p>
              <p
                className="text-[10px] text-muted-foreground truncate leading-tight opacity-80"
                title={tab.url}
              >
                {tab.url}
              </p>
            </div>
            <button
              onClick={() => tab.id && removeTab(tab.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
              title="Remove from context"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleSaveContext}
        className="w-full btn btn-primary flex items-center justify-center gap-2 py-1.5 text-xs h-8"
      >
        <Save className="w-3.5 h-3.5" />
        Start Context
      </button>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
);
