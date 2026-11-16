import { Skeleton } from "@/components/ui/skeleton";

export function AuthFormSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}
