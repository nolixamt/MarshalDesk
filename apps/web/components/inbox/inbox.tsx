"use client";

import { accentColors } from "@marshaldesk/shared";
import { useQuery } from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useReducer,
  useState,
  useSyncExternalStore,
} from "react";

import { useWidgetSettings } from "@/components/dashboard/widget-settings-context";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { agentAvatarUrl, memberAvatarUrl } from "@/lib/avatars";
import { createMockInbox } from "@/lib/mock/inbox";
import { orpc } from "@/lib/orpc/client";

import {
  ConversationList,
  matchesFilter,
  type InboxFilter,
} from "./conversation-list";
import { ConversationView } from "./conversation-view";
import { inboxReducer, type InboxState } from "./inbox-reducer";
import { sortConversations } from "./labels";
import { VisitorDetails } from "./visitor-details";

const handleClassName =
  "w-3 bg-transparent after:w-1 focus-visible:ring-0 [&>div]:opacity-0 hover:[&>div]:opacity-100 focus-visible:[&>div]:opacity-100 data-[separator=active]:[&>div]:opacity-100 [&>div]:transition-opacity";

function initInbox({
  now,
  initialSelectedId,
}: {
  now: number;
  initialSelectedId: string | null;
}): InboxState {
  const inbox = createMockInbox(now);
  const fallback = sortConversations(
    inbox.conversations.filter((c) => matchesFilter(c, "open")),
  )[0];
  const selectedId =
    inbox.conversations.find((c) => c.id === initialSelectedId)?.id ??
    fallback?.id ??
    null;

  return {
    ...inbox,
    conversations: inbox.conversations.map((c) =>
      c.id === selectedId ? { ...c, unread: false } : c,
    ),
    selectedId,
    arrivedIds: new Set(),
  };
}

const WIDE_QUERY = "(min-width: 1280px)";

function subscribeToWidth(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useIsWide(): boolean {
  return useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => true,
  );
}

function writeSelectionToUrl(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("c", id);
  window.history.replaceState(null, "", url);
}

export function Inbox({
  now: serverNow,
  initialSelectedId,
}: {
  now: number;
  initialSelectedId: string | null;
}) {
  const [state, dispatch] = useReducer(
    inboxReducer,
    { now: serverNow, initialSelectedId },
    initInbox,
  );
  const [filter, setFilter] = useState<InboxFilter>("open");
  const isWide = useIsWide();
  const [detailsPreference, setDetailsPreference] = useState<boolean | null>(
    null,
  );
  const detailsOpen = detailsPreference ?? isWide;
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const { settings } = useWidgetSettings();
  const { data: currentOwner } = useQuery(orpc.owner.getCurrent.queryOptions());

  const agent = {
    name: settings.agentName,
    avatarUrl:
      settings.agentAvatarUrl ??
      agentAvatarUrl(settings.agentName, accentColors[settings.color].hex),
  };
  const ownerName = currentOwner?.user.name ?? "You";
  const owner = {
    name: ownerName,
    avatarUrl: currentOwner?.user.image ?? memberAvatarUrl(ownerName),
  };

  const visible = useMemo(
    () =>
      sortConversations(
        state.conversations.filter((c) => matchesFilter(c, filter)),
      ),
    [state.conversations, filter],
  );
  const selected = state.conversations.find((c) => c.id === state.selectedId);

  function select(id: string) {
    dispatch({ type: "select", conversationId: id });
    writeSelectionToUrl(id);
  }

  function changeFilter(next: InboxFilter) {
    setFilter(next);
    if (selected && matchesFilter(selected, next)) return;
    const first = sortConversations(
      state.conversations.filter((c) => matchesFilter(c, next)),
    )[0];
    if (first) select(first.id);
  }

  return (
    <div className="h-[calc(100svh-3.5rem)] px-3 pt-3 pb-3 md:h-[calc(100svh-4.5rem)] lg:px-4">
      <h1 className="sr-only">Inbox</h1>
      <ResizablePanelGroup orientation="horizontal" className="min-h-0">
        <ResizablePanel id="list" defaultSize="30%" minSize={240} maxSize="45%">
          <ConversationList
            conversations={visible}
            allConversations={state.conversations}
            filter={filter}
            onFilterChange={changeFilter}
            selectedId={state.selectedId}
            onSelect={select}
            now={now}
          />
        </ResizablePanel>
        <ResizableHandle withHandle className={handleClassName} />
        <ResizablePanel id="conversation" minSize={340}>
          {selected ? (
            <ConversationView
              conversation={selected}
              messages={state.messages[selected.id] ?? []}
              arrivedIds={state.arrivedIds}
              agent={agent}
              owner={owner}
              now={now}
              detailsOpen={detailsOpen}
              onToggleDetails={() => setDetailsPreference(!detailsOpen)}
              onTakeOver={() =>
                dispatch({ type: "take_over", conversationId: selected.id })
              }
              onHandBack={() =>
                dispatch({
                  type: "hand_back",
                  conversationId: selected.id,
                  messageId: crypto.randomUUID(),
                  at: new Date().toISOString(),
                })
              }
              onClose={() =>
                dispatch({
                  type: "close",
                  conversationId: selected.id,
                  messageId: crypto.randomUUID(),
                  at: new Date().toISOString(),
                })
              }
              onReply={(body) => {
                setNow(Date.now());
                dispatch({
                  type: "reply",
                  conversationId: selected.id,
                  messageId: crypto.randomUUID(),
                  at: new Date().toISOString(),
                  body,
                });
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl bg-card text-sm text-muted-foreground ring-1 ring-foreground/10">
              Pick a conversation to read it here.
            </div>
          )}
        </ResizablePanel>
        {detailsOpen && selected ? (
          <>
            <ResizableHandle withHandle className={handleClassName} />
            <ResizablePanel
              id="details"
              defaultSize="24%"
              minSize={220}
              maxSize="35%"
            >
              <VisitorDetails conversation={selected} now={now} />
            </ResizablePanel>
          </>
        ) : null}
      </ResizablePanelGroup>
    </div>
  );
}
