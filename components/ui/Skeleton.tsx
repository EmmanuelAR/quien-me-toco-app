import { cn } from "@/lib/cn";

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded bg-line", className)} />;
}

export function GroupCardSkeleton() {
  return (
    <div className="py-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <div className="mt-3 flex items-center gap-3">
            <Skeleton className="h-5 w-20 rounded-pill" />
            <Skeleton className="h-5 w-16 rounded-pill" />
          </div>
        </div>
        <Skeleton className="size-5 shrink-0" />
      </div>
    </div>
  );
}

export function GroupListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="mt-3 divide-y divide-line border-y border-line">
      {Array.from({ length: count }).map((_, i) => (
        <GroupCardSkeleton key={i} />
      ))}
    </div>
  );
}
