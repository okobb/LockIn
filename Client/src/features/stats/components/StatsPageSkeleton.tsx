import { Skeleton } from "../../../shared/components/Skeleton/Skeleton";

export function StatsPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between p-6 rounded-xl border border-border/40 bg-card/40 h-32"
          >
            <div className="flex justify-between items-start mb-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card/40 border border-border/40 rounded-xl p-6 h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-48 rounded" />
          </div>
          <div className="flex items-end justify-between gap-4 h-[300px] px-4">
            {[...Array(7)].map((_, i) => (
              <Skeleton
                key={i}
                className="w-full rounded-t-sm h-full"
                style={{ height: `${Math.random() * 60 + 20}%` }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card/40 border border-border/40 rounded-xl p-6 h-40 flex flex-col items-center justify-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-10 w-24 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>

          <div className="bg-card/40 border border-border/40 rounded-xl p-6 h-64 flex flex-col items-center justify-center gap-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="space-y-2 flex flex-col items-center w-full">
              <Skeleton className="h-6 w-20 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-32 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-4 border border-border/40 rounded-xl bg-card/40 h-24 flex flex-col justify-center gap-2"
            >
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-4 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
