"use client";

import { cn } from "cn";

import { WidgetComposer } from "./widget-composer";
import { WidgetHeader } from "./widget-header";
import { WidgetMessage } from "./widget-message";
import { WidgetSuggestedQuestions } from "./widget-suggested-questions";

// Without children the body is the opening state: the greeting and the suggested questions.
// With children (the live widget), the caller renders the whole thread.
export function WidgetPanel({
  agentName,
  avatarUrl,
  status,
  greeting,
  suggestedQuestions = [],
  agentOn,
  draft,
  onDraftChange,
  onDraftBlur,
  onSend,
  onSelectQuestion,
  onTalkToHuman,
  onClose,
  autoFocus,
  bodyRef,
  className,
  children,
}: {
  agentName: string;
  avatarUrl: string;
  status: string;
  greeting?: string;
  suggestedQuestions?: string[];
  agentOn: boolean;
  draft: string;
  onDraftChange?: (value: string) => void;
  onDraftBlur?: () => void;
  onSend?: () => void;
  onSelectQuestion?: (question: string) => void;
  onTalkToHuman?: () => void;
  onClose?: () => void;
  autoFocus?: boolean;
  bodyRef?: React.Ref<HTMLDivElement>;
  className?: string;
  children?: React.ReactNode;
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
      <div
        ref={bodyRef}
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4"
      >
        {children ?? (
          <>
            {greeting !== undefined && (
              <WidgetMessage author={agent}>{greeting}</WidgetMessage>
            )}
            <WidgetSuggestedQuestions
              questions={suggestedQuestions}
              onSelect={onSelectQuestion}
            />
          </>
        )}
      </div>
      <WidgetComposer
        value={draft}
        onValueChange={onDraftChange}
        onBlur={onDraftBlur}
        onSend={onSend}
        showTalkToHuman={agentOn}
        onTalkToHuman={onTalkToHuman}
        autoFocus={autoFocus}
      />
    </section>
  );
}
