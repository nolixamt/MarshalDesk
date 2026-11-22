"use client";

import { accentColors } from "@marshaldesk/shared";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { useInboxPresence } from "@/components/dashboard/realtime-provider";
import { useWidgetSettings } from "@/components/dashboard/widget-settings-context";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { agentAvatarUrl, memberAvatarUrl } from "@/lib/avatars";
import { patchConversation, upsertConversation } from "@/lib/inbox/cache";
import { orpc } from "@/lib/orpc/client";
import { useArrivals } from "@/lib/use-arrivals";

import { ConversationList } from "./conversation-list";
import { ConversationView } from "./conversation-view";
import { matchesFilter, type InboxFilter } from "./filters";
import { sortConversations } from "./labels";
import { useConversationActions } from "./use-conversation-actions";
import { VisitorDetails } from "./visitor-details";

const handleClassName =
  "w-3 bg-transparent after:w-1 focus-visible:ring-0 [&>div]:opacity-0 hover:[&>div]:opacity-100 focus-visible:[&>div]:opacity-100 data-[separator=active]:[&>div]:opacity-100 [&>div]:transition-opacity";

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

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeToVisibility,
    () => document.visibilityState === "visible",
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
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [filter, setFilter] = useState<InboxFilter>("open");
  const isWide = useIsWide();
  const pageVisible = usePageVisible();
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
  const ownerImage = currentOwner?.user.image ?? null;
  const owner = {
    name: ownerName,
    avatarUrl: ownerImage ?? memberAvatarUrl(ownerName),
  };

  const actions = useConversationActions({
    name: ownerName,
    imageUrl: ownerImage,
  });

  const list = useQuery({
    ...orpc.inbox.list.queryOptions(),
    refetchOnWindowFocus: true,
  });
  const conversations = useMemo(() => list.data ?? [], [list.data]);
  const listFailed = list.isError && !list.data;
  const {
    data: detail,
    isError: detailFailed,
    refetch: refetchDetail,
  } = useQuery({
    ...orpc.inbox.get.queryOptions({
      input: selectedId ? { id: selectedId } : skipToken,
    }),
    refetchOnWindowFocus: true,
    retry: false,
  });

  const listed = conversations.find((c) => c.id === selectedId);
  const loadedDetail = detail?.conversation.id === selectedId ? detail : null;
  const selected = loadedDetail?.conversation ?? listed;
  const messages = loadedDetail?.messages;

  const rowArrivals = useArrivals(
    conversations.map((c) => c.id),
    "list",
  );
  const messageArrivals = useArrivals(
    (messages ?? []).filter((m) => m.author !== "member").map((m) => m.id),
    loadedDetail ? loadedDetail.conversation.id : null,
  );

  const { mutate: markRead } = useMutation(
    orpc.inbox.markRead.mutationOptions({
      onSuccess: (conversation) =>
        upsertConversation(queryClient, conversation),
    }),
  );
  const selectedUnread = Boolean(
    listed?.unread || loadedDetail?.conversation.unread,
  );
  const selectedLastMessageAt = selected?.lastMessageAt ?? null;
  // The newest message each markRead covered. A refetch that started before a markRead landed can
  // still say unread; that only needs the local patch, not another request.
  const markedThrough = useRef(new Map<string, string>());

  useEffect(() => {
    if (!selectedId || !selectedUnread || !pageVisible) return;
    patchConversation(queryClient, selectedId, { unread: false });
    if (!selectedLastMessageAt) return;
    const marked = markedThrough.current.get(selectedId);
    if (marked && Date.parse(marked) >= Date.parse(selectedLastMessageAt)) {
      return;
    }
    markedThrough.current.set(selectedId, selectedLastMessageAt);
    markRead(
      { id: selectedId },
      { onError: () => markedThrough.current.delete(selectedId) },
    );
  }, [
    selectedId,
    selectedUnread,
    selectedLastMessageAt,
    pageVisible,
    queryClient,
    markRead,
  ]);

  const visible = useMemo(
    () =>
      sortConversations(conversations.filter((c) => matchesFilter(c, filter))),
    [conversations, filter],
  );

  function select(id: string) {
    setSelectedId(id);
    actions.dismissNotice();
    writeSelectionToUrl(id);
  }

  useInboxPresence(selectedId, (id) => {
    const target = conversations.find((c) => c.id === id);
    if (target && !matchesFilter(target, filter)) setFilter("open");
    select(id);
  });

  function changeFilter(next: InboxFilter) {
    setFilter(next);
    if (selected && matchesFilter(selected, next)) return;
    const first = sortConversations(
      conversations.filter((c) => matchesFilter(c, next)),
    )[0];
    if (first) select(first.id);
  }

  const showConversation = selected && !(detailFailed && !listed);

  return (
    <div className="h-[calc(100svh-3.5rem)] px-3 pt-3 pb-3 md:h-[calc(100svh-4.5rem)] lg:px-4">
      <h1 className="sr-only">Inbox</h1>
      <ResizablePanelGroup orientation="horizontal" className="min-h-0">
        <ResizablePanel id="list" defaultSize="30%" minSize={240} maxSize="45%">
          <ConversationList
            conversations={visible}
            allConversations={conversations}
            arrivedIds={rowArrivals}
            filter={filter}
            onFilterChange={changeFilter}
            selectedId={selectedId}
            onSelect={select}
            loadFailed={listFailed}
            onRetry={() => void list.refetch()}
            now={now}
          />
        </ResizablePanel>
        <ResizableHandle withHandle className={handleClassName} />
        <ResizablePanel id="conversation" minSize={340}>
          {showConversation ? (
            <ConversationView
              conversation={selected}
              messages={messages}
              loadFailed={detailFailed && !loadedDetail}
              onRetry={() => void refetchDetail()}
              arrivedIds={messageArrivals}
              agent={agent}
              owner={owner}
              now={now}
              busy={actions.pending}
              notice={
                actions.notice?.conversationId === selected.id
                  ? actions.notice.text
                  : null
              }
              onDismissNotice={actions.dismissNotice}
              detailsOpen={detailsOpen}
              onToggleDetails={() => setDetailsPreference(!detailsOpen)}
              onTakeOver={() => actions.takeOver(selected.id)}
              onHandBack={() => actions.handBack(selected.id)}
              onClose={() => actions.close(selected.id)}
              onReply={async (body) => {
                setNow(Date.now());
                await actions.reply(selected.id, body);
              }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl bg-card px-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
              {selectedId && detailFailed ? (
                <>
                  <p>Couldn&apos;t load this conversation.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void refetchDetail()}
                  >
                    Retry
                  </Button>
                </>
              ) : conversations.length === 0 && !listFailed ? (
                "Conversations show up here as soon as a visitor writes in."
              ) : (
                "Pick a conversation to read it here."
              )}
            </div>
          )}
        </ResizablePanel>
        {detailsOpen && showConversation ? (
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
