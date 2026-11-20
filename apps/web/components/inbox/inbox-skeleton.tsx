import { Skeleton } from "@/components/ui/skeleton";

export function InboxSkeleton() {
  return (
    <div className="flex h-[calc(100svh-3.5rem)] gap-3 px-3 pt-3 pb-3 md:h-[calc(100svh-4.5rem)] lg:px-4">
      <div className="flex w-[30%] min-w-[240px] flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-full" />
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 rounded-xl bg-card ring-1 ring-foreground/10" />
      <div className="hidden w-[24%] min-w-[220px] rounded-xl bg-card ring-1 ring-foreground/10 xl:block" />
    </div>
  );
}
