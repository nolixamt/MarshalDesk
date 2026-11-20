"use client";

import type { Conversation } from "@marshaldesk/shared";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { visitorAvatarUrl } from "@/lib/avatars";
import { cn } from "@/lib/utils";

import { inboxFilters, matchesFilter, type InboxFilter } from "./filters";
import { shortTimeAgo, visitorName } from "./labels";
import { StateBadge } from "./state-badge";

function emptyMessage(filter: InboxFilter): string {
  switch (filter) {
    case "open":
      return "No open conversations. Nice and quiet.";
    case "waiting":
      return "Nobody's waiting for you right now.";
    case "ai":
      return "The agent isn't handling any conversations right now.";
    case "human":
      return "You're not in any conversations right now.";
    case "closed":
      return "No closed conversations yet.";
    default: {
      const unhandled: never = filter;
      return unhandled;
    }
  }
}

export function ConversationList({
  conversations,
  allConversations,
  arrivedIds,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
  loadFailed,
  onRetry,
  now,
}: {
  conversations: Conversation[];
  allConversations: Conversation[];
  arrivedIds: ReadonlySet<string>;
  filter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  loadFailed: boolean;
  onRetry: () => void;
  now: number;
}) {
  return (
    <section
      aria-label="Conversations"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
    >
      <div className="flex shrink-0 flex-col gap-3 border-b border-foreground/10 p-3">
        <h2 className="px-1 text-sm font-semibold">Conversations</h2>
        <ToggleGroup
          aria-label="Filter by state"
          value={[filter]}
          onValueChange={(value: unknown[]) => {
            const next = value[0];
            const match = inboxFilters.find((f) => f.value === next);
            if (match) onFilterChange(match.value);
          }}
          size="sm"
          spacing={1}
          className="w-full flex-wrap"
        >
          {inboxFilters.map((f) => {
            const count = allConversations.filter((c) =>
              matchesFilter(c, f.value),
            ).length;
            return (
              <ToggleGroupItem
                key={f.value}
                value={f.value}
                className="gap-1.5 text-muted-foreground data-pressed:text-foreground"
              >
                {f.label}
                <span className="text-xs text-muted-foreground tabular-nums">
                  {count}
                </span>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      {loadFailed ? (
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center text-sm text-muted-foreground">
          <p>Couldn&apos;t load your conversations.</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : conversations.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          {emptyMessage(filter)}
        </p>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <ul className="divide-y divide-foreground/10">
            {conversations.map((conversation) => (
              <li
                key={conversation.id}
                className={
                  arrivedIds.has(conversation.id)
                    ? "animate-enter motion-reduce:animate-none"
                    : undefined
                }
              >
                <ConversationRow
                  conversation={conversation}
                  selected={conversation.id === selectedId}
                  onSelect={() => onSelect(conversation.id)}
                  now={now}
                />
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </section>
  );
}

function ConversationRow({
  conversation,
  selected,
  onSelect,
  now,
}: {
  conversation: Conversation;
  selected: boolean;
  onSelect: () => void;
  now: number;
}) {
  const name = visitorName(conversation.visitor);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors outline-none focus-visible:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
        selected ? "bg-muted" : "hover:bg-muted/50",
      )}
    >
      <Avatar className="mt-0.5 size-9">
        <AvatarImage src={visitorAvatarUrl(conversation.visitor.id)} alt="" />
        <AvatarFallback />
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-sm",
              conversation.unread ? "font-semibold" : "font-medium",
            )}
          >
            {name}
          </span>
          {conversation.unread ? (
            <span className="size-2 shrink-0 rounded-full bg-primary">
              <span className="sr-only">Unread</span>
            </span>
          ) : null}
          <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
            {shortTimeAgo(conversation.lastMessageAt, now)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              conversation.unread ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {conversation.lastMessagePreview}
          </p>
          <StateBadge state={conversation.state} />
        </div>
      </div>
    </button>
  );
}
