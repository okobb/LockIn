import React from "react";

export const ResourceCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col p-4 rounded-xl border border-border bg-card/50 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-muted/50" />
          <div className="w-20 h-5 rounded-full bg-muted/50" />
        </div>
        <div className="w-7 h-7 rounded-full bg-muted/50" />
      </div>

      <div className="h-4 bg-muted/50 rounded w-4/5 mb-1" />
      <div className="h-4 bg-muted/50 rounded w-3/5 mb-3" />

      <div className="h-3 bg-muted/40 rounded w-full mb-1.5" />
      <div className="h-3 bg-muted/40 rounded w-11/12 mb-3" />

      <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-14 h-3 bg-muted/40 rounded" />
          <div className="w-10 h-3 bg-muted/40 rounded" />
        </div>
        <div className="w-2 h-2 rounded-full bg-muted/50" />
      </div>
    </div>
  );
};
