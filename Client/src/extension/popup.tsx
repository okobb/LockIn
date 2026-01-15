import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Save, ExternalLink, X } from "lucide-react";
import "../shared/styles/global.css";
import "./popup.css";

interface TabData {
  id?: number;
  title?: string;
  url?: string;
  favIconUrl?: string;
}

const Popup = () => {
  const [tabs, setTabs] = useState<TabData[]>([]);

  useEffect(() => {
    // Fetch all tabs in the current window
    chrome.tabs.query({ currentWindow: true }, (result) => {
      setTabs(result);
    });
  }, []);

  const handleSaveContext = () => {
    console.log("Saving context:", tabs);
    // TODO: Connect to backend API
  };

  const removeTab = (tabId: number) => {
    setTabs(tabs.filter((t) => t.id !== tabId));
  };

  return (
    <div className="w-[350px] min-h-[400px] p-4 bg-app text-primary">
      <header className="flex items-center justify-between mb-4 border-b border-border-default pb-2">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Save className="w-5 h-5 text-primary" />
          Context Saver
        </h1>
        <span className="text-xs text-text-muted bg-bg-card px-2 py-1 rounded">
          {tabs.length} Tabs
        </span>
      </header>

      <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className="group flex items-start gap-3 p-2 rounded-md hover:bg-bg-card-hover transition-colors border border-transparent hover:border-border-subtle"
          >
            {tab.favIconUrl ? (
              <img
                src={tab.favIconUrl}
                alt=""
                className="w-4 h-4 mt-1 opacity-80"
              />
            ) : (
              <ExternalLink className="w-4 h-4 mt-1 text-text-tertiary" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" title={tab.title}>
                {tab.title}
              </p>
              <p className="text-xs text-text-muted truncate" title={tab.url}>
                {tab.url}
              </p>
            </div>
            <button
              onClick={() => tab.id && removeTab(tab.id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-danger transition-all"
              title="Remove from context"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleSaveContext}
        className="w-full btn btn-primary flex items-center justify-center gap-2 py-2"
      >
        <Save className="w-4 h-4" />
        Save Context
      </button>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
