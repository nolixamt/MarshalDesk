"use client";

import { MESSAGE_MAX_LENGTH, replyInputSchema } from "@marshaldesk/shared";
import { SendHorizontalIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const COUNTER_FROM = MESSAGE_MAX_LENGTH - 500;

export function Composer({
  takesOver,
  onSend,
}: {
  takesOver: boolean;
  onSend: (body: string) => void;
}) {
  const [body, setBody] = useState("");
  const parsed = replyInputSchema.safeParse({ body });

  function send() {
    if (!parsed.success) return;
    onSend(parsed.data.body);
    setBody("");
  }

  return (
    <form
      className="shrink-0 border-t border-foreground/10 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <div className="rounded-lg ring-1 ring-foreground/10 transition-shadow focus-within:ring-2 focus-within:ring-ring/50">
        <Textarea
          aria-label="Reply"
          value={body}
          maxLength={MESSAGE_MAX_LENGTH}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              send();
            }
          }}
          placeholder={
            takesOver ? "Reply to take over from the agent" : "Write a reply"
          }
          className="max-h-48 min-h-20 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <div className="flex items-center gap-3 px-2.5 pb-2">
          <p className="text-xs text-muted-foreground">
            Enter to send · Shift+Enter for a new line
          </p>
          {body.length >= COUNTER_FROM ? (
            <p className="text-xs text-muted-foreground tabular-nums">
              {body.length}/{MESSAGE_MAX_LENGTH}
            </p>
          ) : null}
          <Button
            type="submit"
            size="sm"
            className="ml-auto"
            disabled={!parsed.success}
          >
            Send
            <SendHorizontalIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </form>
  );
}
