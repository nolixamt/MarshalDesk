"use client";

import { MESSAGE_MAX_LENGTH } from "@marshaldesk/shared";
import { ArrowUpIcon } from "lucide-react";

import { IconButton } from "@/components/dashboard/icon-button";
import { Button } from "@/components/ui/button";

const COUNTER_THRESHOLD = MESSAGE_MAX_LENGTH - 400;

export function WidgetComposer({
  value,
  onValueChange,
  onBlur,
  onSend,
  showTalkToHuman,
  onTalkToHuman,
  autoFocus,
}: {
  value: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  onSend?: () => void;
  showTalkToHuman: boolean;
  onTalkToHuman?: () => void;
  autoFocus?: boolean;
}) {
  const canSend = value.trim().length > 0;

  return (
    <div className="flex flex-col gap-2 border-t border-foreground/10 p-3">
      {showTalkToHuman && (
        <Button
          variant="ghost"
          size="xs"
          className="self-center text-muted-foreground"
          onClick={onTalkToHuman}
        >
          Talk to a human
        </Button>
      )}
      <form
        className="flex items-end gap-2 rounded-lg bg-background p-1.5 ring-1 ring-foreground/10 focus-within:ring-ring"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSend) {
            onSend?.();
          }
        }}
      >
        <textarea
          rows={1}
          value={value}
          maxLength={MESSAGE_MAX_LENGTH}
          autoFocus={autoFocus}
          onChange={(event) => onValueChange?.(event.target.value)}
          onBlur={onBlur}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Write a message…"
          aria-label="Message"
          className="field-sizing-content max-h-28 min-h-8 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-base outline-none placeholder:text-muted-foreground sm:text-sm"
        />
        <IconButton
          label="Send"
          type="submit"
          variant="default"
          size="icon"
          disabled={!canSend}
          side="top"
        >
          <ArrowUpIcon />
        </IconButton>
      </form>
      {value.length > COUNTER_THRESHOLD && (
        <p className="self-end text-xs text-muted-foreground tabular-nums">
          {value.length} / {MESSAGE_MAX_LENGTH}
        </p>
      )}
    </div>
  );
}
