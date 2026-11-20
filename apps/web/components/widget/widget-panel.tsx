"use client";

import { cn } from "cn";

import { WidgetComposer } from "./widget-composer";
import { WidgetHeader } from "./widget-header";
import { WidgetMessage } from "./widget-message";
import { WidgetSuggestedQuestions } from "./widget-suggested-questions";

export function WidgetPanel({
  agentName,
  avatarUrl,
  status,
  greeting,
  suggestedQuestions,
  agentOn,
  draft,
  onDraftChange,
  onSend,
  onSelectQuestion,
  onTalkToHuman,
  onClose,
  className,
}: {
  agentName: string;
  avatarUrl: string;
  status: string;
  greeting: string;
  suggestedQuestions: string[];
  agentOn: boolean;
  draft: string;
  onDraftChange?: (value: string) => void;
  onSend?: () => void;
  onSelectQuestion?: (question: string) => void;
  onTalkToHuman?: () => void;
  onClose?: () => void;
  className?: string;
}) {
  const agent = { role: "agent", name: agentName, avatarUrl } as const;

  return (
    <section
      aria-label={`Chat with ${agentName}`}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl bg-background shadow-lg ring-1 ring-foreground/10",
        className,
      )}
    >
      <WidgetHeader
        agentName={agentName}
        avatarUrl={avatarUrl}
        status={status}
        onClose={onClose}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <WidgetMessage author={agent}>{greeting}</WidgetMessage>
        <WidgetSuggestedQuestions
          questions={suggestedQuestions}
          onSelect={onSelectQuestion}
        />
      </div>
      <WidgetComposer
        value={draft}
        onValueChange={onDraftChange}
        onSend={onSend}
        showTalkToHuman={agentOn}
        onTalkToHuman={onTalkToHuman}
      />
    </section>
  );
}
