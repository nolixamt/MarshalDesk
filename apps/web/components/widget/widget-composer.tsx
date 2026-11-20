"use client";

import { ArrowUpIcon } from "lucide-react";

import { IconButton } from "@/components/dashboard/icon-button";
import { Button } from "@/components/ui/button";

export function WidgetComposer({
  value,
  onValueChange,
  onSend,
  showTalkToHuman,
  onTalkToHuman,
}: {
  value: string;
  onValueChange?: (value: string) => void;
  onSend?: () => void;
  showTalkToHuman: boolean;
  onTalkToHuman?: () => void;
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
          onChange={(event) => onValueChange?.(event.target.value)}
          placeholder="Write a message…"
          aria-label="Message"
          className="field-sizing-content max-h-28 min-h-8 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
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
    </div>
  );
}
