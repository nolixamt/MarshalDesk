"use client";

import type { Conversation, Message } from "@marshaldesk/shared";
import { PanelRightCloseIcon, PanelRightOpenIcon } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

import { IconButton } from "@/components/dashboard/icon-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { visitorAvatarUrl } from "@/lib/avatars";

import { canTransition } from "./inbox-reducer";
import { handoffReasonLabel, visitorName } from "./labels";
import { MessageItem, type Participant } from "./message-item";
import { Composer } from "./composer";
import { StateBadge } from "./state-badge";

export function ConversationView({
  conversation,
  messages,
  arrivedIds,
  agent,
  owner,
  now,
  detailsOpen,
  onToggleDetails,
  onTakeOver,
  onHandBack,
  onClose,
  onReply,
}: {
  conversation: Conversation;
  messages: Message[];
  arrivedIds: ReadonlySet<string>;
  agent: Participant;
  owner: Participant;
  now: number;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  onTakeOver: () => void;
  onHandBack: () => void;
  onClose: () => void;
  onReply: (body: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const { state } = conversation;

  useLayoutEffect(() => {
    const viewport = endRef.current?.closest<HTMLElement>(
      "[data-slot=scroll-area-viewport]",
    );
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [conversation.id, messages.length]);

  return (
    <section
      aria-label="Conversation"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
    >
      <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-foreground/10 px-4 py-3">
        <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage
              src={visitorAvatarUrl(conversation.visitor.id)}
              alt=""
            />
            <AvatarFallback />
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold">
                {visitorName(conversation.visitor)}
              </h2>
              <StateBadge state={state} />
            </div>
            {state === "waiting" && conversation.handoffReason ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {handoffReasonLabel(conversation.handoffReason)}
              </p>
            ) : null}
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {canTransition(state, "take_over") ? (
            <Button size="sm" onClick={onTakeOver}>
              Take over
            </Button>
          ) : null}
          {canTransition(state, "hand_back") ? (
            <Button size="sm" variant="outline" onClick={onHandBack}>
              Hand to agent
            </Button>
          ) : null}
          {canTransition(state, "close") ? (
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          ) : null}
          <IconButton
            label={
              detailsOpen ? "Hide visitor details" : "Show visitor details"
            }
            onClick={onToggleDetails}
          >
            {detailsOpen ? <PanelRightCloseIcon /> : <PanelRightOpenIcon />}
          </IconButton>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 px-4 py-5">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              agent={agent}
              owner={owner}
              arrived={arrivedIds.has(message.id)}
              now={now}
            />
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      {state === "closed" ? (
        <p className="shrink-0 border-t border-foreground/10 px-4 py-4 text-center text-sm text-muted-foreground">
          This conversation is closed. If the visitor writes again, it starts a
          new conversation.
        </p>
      ) : (
        <Composer
          key={conversation.id}
          takesOver={state !== "human"}
          onSend={onReply}
        />
      )}
    </section>
  );
}
