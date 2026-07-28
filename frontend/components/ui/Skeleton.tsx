"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="glass-card p-6 space-y-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="glass-card p-6 space-y-3">
      <Skeleton className="h-4 w-48" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
