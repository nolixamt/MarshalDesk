"use client";

import { cn } from "cn";
import { CheckIcon, CircleAlertIcon } from "lucide-react";

import {
  type SaveStatus as SaveStatusValue,
  useWidgetSettings,
} from "@/components/dashboard/widget-settings-context";
import { Button } from "@/components/ui/button";

function SavingDots() {
  return (
    <span aria-hidden className="flex gap-0.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1 animate-pulse rounded-full bg-current motion-reduce:animate-none"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

function StatusContent({
  status,
  onRetry,
}: {
  status: SaveStatusValue;
  onRetry: () => void;
}) {
  switch (status) {
    case "idle":
      return null;
    case "saving":
      return (
        <>
          <SavingDots />
          Saving…
        </>
      );
    case "saved":
      return (
        <>
          <CheckIcon aria-hidden className="size-3.5" />
          All changes saved
        </>
      );
    case "error":
      return (
        <>
          <CircleAlertIcon aria-hidden className="size-3.5 text-destructive" />
          <span className="text-destructive">Couldn&apos;t save</span>
          <Button variant="outline" size="xs" onClick={onRetry}>
            Retry
          </Button>
        </>
      );
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function SaveStatus({ className }: { className?: string }) {
  const { saveStatus, retrySave } = useWidgetSettings();

  return (
    <div
      role="status"
      className={cn(
        "flex min-h-6 items-center gap-1.5 text-sm text-muted-foreground",
        className,
      )}
    >
      <StatusContent status={saveStatus} onRetry={retrySave} />
    </div>
  );
}
