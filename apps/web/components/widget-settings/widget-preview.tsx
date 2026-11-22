"use client";

import {
  accentColors,
  MAX_SUGGESTED_QUESTIONS,
  type WidgetPosition,
} from "@marshaldesk/shared";
import { cn } from "cn";
import { LockIcon } from "lucide-react";

import { useWidgetSettings } from "@/components/dashboard/widget-settings-context";
import { WidgetLauncher } from "@/components/widget/widget-launcher";
import { WidgetPanel } from "@/components/widget/widget-panel";
import {
  resolveAgentAvatarUrl,
  WidgetTheme,
} from "@/components/widget/widget-theme";
import { mockSuggestedQuestions } from "@/lib/mock/widget-settings";

function cornerClassName(position: WidgetPosition): string {
  switch (position) {
    case "bottom-left":
      return "left-4 items-start";
    case "bottom-right":
      return "right-4 items-end";
    default: {
      const unreachable: never = position;
      return unreachable;
    }
  }
}

function PagePlaceholder() {
  return (
    <div aria-hidden className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <div className="h-3 w-16 rounded-full bg-foreground/10" />
        <div className="flex gap-2">
          <div className="h-2 w-8 rounded-full bg-foreground/[0.07]" />
          <div className="h-2 w-8 rounded-full bg-foreground/[0.07]" />
          <div className="h-2 w-8 rounded-full bg-foreground/[0.07]" />
        </div>
      </div>
      <div className="mt-4 h-5 w-3/4 rounded-full bg-foreground/10" />
      <div className="h-3 w-1/2 rounded-full bg-foreground/[0.07]" />
      <div className="mt-3 h-28 rounded-lg bg-foreground/[0.06]" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-16 rounded-lg bg-foreground/[0.06]" />
        <div className="h-16 rounded-lg bg-foreground/[0.06]" />
        <div className="h-16 rounded-lg bg-foreground/[0.06]" />
      </div>
      <div className="h-3 w-2/3 rounded-full bg-foreground/[0.07]" />
      <div className="h-3 w-1/2 rounded-full bg-foreground/[0.07]" />
    </div>
  );
}

export function WidgetPreview() {
  const { settings, setupProgress } = useWidgetSettings();
  // The agent stays off until the knowledge base has a ready source, as in the real widget.
  const agentOn = setupProgress.hasReadySource;
  const accent = accentColors[settings.color];
  const address = settings.allowedDomains[0] ?? "yourwebsite.com";
  const avatarUrl = resolveAgentAvatarUrl(
    settings.agentName,
    settings.agentAvatarUrl,
    accent,
  );

  return (
    <figure className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <div className="flex items-center gap-3 border-b border-foreground/10 px-3 py-2.5">
          <div aria-hidden className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            <LockIcon aria-hidden className="size-3 shrink-0" />
            <span className="truncate">{address}</span>
          </div>
          <div aria-hidden className="w-[2.625rem]" />
        </div>
        <div
          inert
          className="relative h-[clamp(32rem,calc(100dvh-13rem),40rem)] bg-muted/40"
        >
          <PagePlaceholder />
          <WidgetTheme
            accent={accent}
            className={cn(
              "absolute top-4 bottom-4 flex w-[19.5rem] max-w-[calc(100%-2rem)] flex-col justify-end gap-3",
              cornerClassName(settings.position),
            )}
          >
            <WidgetPanel
              className="max-h-[33rem] min-h-0 w-full flex-1"
              agentName={settings.agentName}
              avatarUrl={avatarUrl}
              status="Here to help"
              greeting={settings.greeting}
              suggestedQuestions={
                agentOn
                  ? mockSuggestedQuestions.slice(0, MAX_SUGGESTED_QUESTIONS)
                  : []
              }
              agentOn={agentOn}
              draft=""
            />
            <WidgetLauncher open />
          </WidgetTheme>
        </div>
      </div>
      <figcaption className="text-center text-xs text-muted-foreground">
        A live preview of your widget. Changes show up here right away.
      </figcaption>
    </figure>
  );
}
