import React from "react";
import { Card, CardContent } from "../../../shared/components/UI/Card";

export const ContextHistorySkeleton: React.FC = () => {
  return (
    <div className="relative pl-8 animate-pulse">
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border/40" />

      <div className="mb-8">
        <div className="h-4 w-16 bg-muted/50 rounded mb-4" />

        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-8 top-4 w-3 h-3 rounded-full bg-muted/50" />
              <Card className="bg-card/40 border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-40 bg-muted/50 rounded" />
                      <div className="h-5 w-20 bg-muted/40 rounded-full" />
                    </div>
                    <div className="h-4 w-12 bg-muted/40 rounded" />
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="h-3 w-20 bg-muted/40 rounded" />
                    <div className="h-3 w-16 bg-muted/40 rounded" />
                    <div className="h-3 w-12 bg-muted/40 rounded" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/20">
                    <div className="h-5 w-8 bg-muted/40 rounded" />
                    <div className="h-6 w-16 bg-muted/30 rounded" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <div className="h-4 w-24 bg-muted/50 rounded mb-4" />

        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-8 top-4 w-3 h-3 rounded-full bg-muted/50" />
              <Card className="bg-card/40 border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-48 bg-muted/50 rounded" />
                      <div className="h-5 w-16 bg-muted/40 rounded-full" />
                    </div>
                    <div className="h-4 w-12 bg-muted/40 rounded" />
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="h-3 w-24 bg-muted/40 rounded" />
                    <div className="h-3 w-14 bg-muted/40 rounded" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/20">
                    <div className="h-5 w-8 bg-muted/40 rounded" />
                    <div className="h-6 w-16 bg-muted/30 rounded" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
