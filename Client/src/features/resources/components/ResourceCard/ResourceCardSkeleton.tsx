import React from "react";

export const ResourceCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col p-4 rounded-xl border border-border bg-card/50 h-[180px] animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-lg bg-muted-foreground/10" />
          <div className="w-16 h-5 rounded-full bg-muted-foreground/10" />
        </div>
        <div className="w-6 h-6 rounded-full bg-muted-foreground/10" />
      </div>

      <div className="space-y-2 mb-3">
        <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
        <div className="h-4 bg-muted-foreground/10 rounded w-1/2" />
      </div>

      <div className="space-y-2 mb-auto">
        <div className="h-3 bg-muted-foreground/10 rounded w-full" />
        <div className="h-3 bg-muted-foreground/10 rounded w-5/6" />
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
        <div className="flex gap-2">
          <div className="w-16 h-3 bg-muted-foreground/10 rounded" />
          <div className="w-12 h-3 bg-muted-foreground/10 rounded" />
        </div>
        <div className="w-4 h-4 rounded-full bg-muted-foreground/10" />
      </div>
    </div>
  );
};
