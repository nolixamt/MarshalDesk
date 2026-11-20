"use client";

import type { Conversation, Message } from "@marshaldesk/shared";
import { PanelRightCloseIcon, PanelRightOpenIcon, XIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";

import { IconButton } from "@/components/dashboard/icon-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { visitorAvatarUrl } from "@/lib/avatars";

import { Composer } from "./composer";
import { handoffReasonLabel, visitorName } from "./labels";
import { MessageItem, type Participant } from "./message-item";
import { StateBadge } from "./state-badge";
import { canTransition } from "./transitions";
import { TypingIndicator } from "./typing-indicator";
import { useConversationRoom } from "./use-conversation-room";

const NOTICE_MS = 6_000;

export function ConversationView({
  conversation,
  messages,
  loadFailed,
  onRetry,
  arrivedIds,
  agent,
  owner,
  now,
  busy,
  notice,
  onDismissNotice,
  detailsOpen,
  onToggleDetails,
  onTakeOver,
  onHandBack,
  onClose,
  onReply,
}: {
  conversation: Conversation;
  messages: Message[] | undefined;
  loadFailed: boolean;
  onRetry: () => void;
  arrivedIds: ReadonlySet<string>;
  agent: Participant;
  owner: Participant;
  now: number;
  busy: boolean;
  notice: string | null;
  onDismissNotice: () => void;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  onTakeOver: () => void;
  onHandBack: () => void;
  onClose: () => void;
  onReply: (body: string) => Promise<void>;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const { state } = conversation;
  const { visitorTyping, notifyTyping, stopTyping } = useConversationRoom(
    state === "closed" ? null : conversation.id,
  );
  const name = visitorName(conversation.visitor);

  useLayoutEffect(() => {
    const viewport = endRef.current?.closest<HTMLElement>(
      "[data-slot=scroll-area-viewport]",
    );
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [conversation.id, messages?.length, visitorTyping]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(onDismissNotice, NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [notice, onDismissNotice]);

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
              <h2 className="truncate text-sm font-semibold">{name}</h2>
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
            <Button size="sm" disabled={busy} onClick={onTakeOver}>
              Take over
            </Button>
          ) : null}
          {canTransition(state, "hand_back") ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={onHandBack}
            >
              Hand to agent
            </Button>
          ) : null}
          {canTransition(state, "close") ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
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

      {notice ? (
        <div
          role="status"
          className="flex shrink-0 items-center gap-2 border-b border-foreground/10 bg-muted/60 py-1.5 pr-1.5 pl-4 text-xs text-muted-foreground"
        >
          <p className="min-w-0 flex-1">{notice}</p>
          <IconButton label="Dismiss" onClick={onDismissNotice}>
            <XIcon />
          </IconButton>
        </div>
      ) : null}

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 px-4 py-5">
          {messages ? (
            messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                agent={agent}
                owner={owner}
                arrived={arrivedIds.has(message.id)}
                now={now}
              />
            ))
          ) : loadFailed ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
              <p>Couldn&apos;t load this conversation.</p>
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            </div>
          ) : (
            <MessagesSkeleton />
          )}
          {messages && visitorTyping ? <TypingIndicator name={name} /> : null}
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
          onTyping={notifyTyping}
          onStopTyping={stopTyping}
        />
      )}
    </section>
  );
}

function MessagesSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5">
      <Skeleton className="h-10 w-3/5 rounded-xl" />
      <Skeleton className="ml-auto h-14 w-2/3 rounded-xl" />
      <Skeleton className="h-10 w-1/2 rounded-xl" />
    </div>
  );
}
