"use client";

import type {
  Conversation,
  ConversationState,
  Message,
  WorkspaceRoomEvent,
} from "@marshaldesk/shared";
import { parseWorkspaceRoomEvent } from "@marshaldesk/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { usePartySocket } from "partysocket/react";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { visitorName } from "@/components/inbox/labels";
import { showBrowserNotification } from "@/lib/inbox/browser-notifications";
import {
  receiveMessage,
  resyncInbox,
  upsertConversation,
} from "@/lib/inbox/cache";
import { playNotificationSound } from "@/lib/notification-sound";
import { client, orpc } from "@/lib/orpc/client";
import { REALTIME_HOST } from "@/lib/realtime/host";
import { useTokenRejection } from "@/lib/use-token-rejection";

import { useWidgetSettings } from "./widget-settings-context";

const INBOX_PATH = "/dashboard/inbox";
const PREVIEW_LENGTH = 140;
const BADGE_PREFIX = /^\(\d+\) /;

type OpenRequestHandler = (conversationId: string) => void;

type InboxRealtimeContextValue = {
  setOpenConversation: (id: string | null) => void;
  setOpenRequestHandler: (handler: OpenRequestHandler | null) => void;
};

const InboxRealtimeContext = createContext<InboxRealtimeContextValue | null>(
  null,
);

function notifiesOwner(state: ConversationState): boolean {
  switch (state) {
    case "waiting":
    case "human":
      return true;
    case "ai":
    case "closed":
      return false;
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

function preview(conversation: Conversation, message: Message): string {
  const text = message.body.trim() || conversation.lastMessagePreview;
  return text.length > PREVIEW_LENGTH
    ? `${text.slice(0, PREVIEW_LENGTH - 1)}…`
    : text;
}

function parseEvent(data: unknown): WorkspaceRoomEvent | null {
  if (typeof data !== "string") return null;
  try {
    return parseWorkspaceRoomEvent(JSON.parse(data));
  } catch {
    return null;
  }
}

function useTitleBadge(count: number) {
  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(BADGE_PREFIX, "");
      const next = count > 0 ? `(${count}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    // Next.js rewrites the title on navigation, so the badge is re-applied whenever it changes.
    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => {
      observer.disconnect();
      document.title = document.title.replace(BADGE_PREFIX, "");
    };
  }, [count]);
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { workspaceId } = useWidgetSettings();
  const openConversationRef = useRef<string | null>(null);
  const openRequestRef = useRef<OpenRequestHandler | null>(null);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const { data: conversations } = useQuery({
    ...orpc.inbox.list.queryOptions(),
    refetchOnWindowFocus: true,
  });
  const unreadCount = (conversations ?? []).filter(
    (c) => c.unread && notifiesOwner(c.state),
  ).length;
  useTitleBadge(unreadCount);

  function openConversation(id: string) {
    const handler = openRequestRef.current;
    if (handler && pathnameRef.current === INBOX_PATH) {
      handler(id);
      return;
    }
    router.push(`${INBOX_PATH}?c=${encodeURIComponent(id)}`);
  }

  function notify(conversation: Conversation, message: Message) {
    if (message.author !== "visitor" || !notifiesOwner(conversation.state)) {
      return;
    }
    playNotificationSound();
    const watching =
      document.visibilityState === "visible" &&
      pathnameRef.current === INBOX_PATH &&
      openConversationRef.current === conversation.id;
    if (watching) return;
    showBrowserNotification({
      title: `New message from ${visitorName(conversation.visitor)}`,
      body: preview(conversation, message),
      tag: conversation.id,
      onClick: () => openConversation(conversation.id),
    });
  }

  function handleEvent(event: WorkspaceRoomEvent) {
    switch (event.type) {
      case "inbox.message":
        upsertConversation(queryClient, event.conversation);
        receiveMessage(queryClient, event.message);
        notify(event.conversation, event.message);
        return;
      case "inbox.conversation":
        upsertConversation(queryClient, event.conversation);
        return;
      default: {
        const unhandled: never = event;
        return unhandled;
      }
    }
  }

  const { rejected, guard } = useTokenRejection(workspaceId);
  usePartySocket({
    host: REALTIME_HOST,
    party: "workspace",
    room: workspaceId,
    enabled: !rejected,
    // Tokens live 60 s and only open the socket, so every (re)connect fetches a fresh one.
    query: async () => ({
      token: (
        await guard(() => client.realtime.getToken({ party: "workspace" }))
      ).token,
    }),
    // Events sent while the socket was down are lost; the API is the store, so resync from it.
    onOpen: () => void resyncInbox(queryClient),
    onMessage: (message) => {
      const event = parseEvent(message.data);
      if (event) handleEvent(event);
    },
  });

  const setOpenConversation = useCallback((id: string | null) => {
    openConversationRef.current = id;
  }, []);
  const setOpenRequestHandler = useCallback(
    (handler: OpenRequestHandler | null) => {
      openRequestRef.current = handler;
    },
    [],
  );
  const value = useMemo(
    () => ({ setOpenConversation, setOpenRequestHandler }),
    [setOpenConversation, setOpenRequestHandler],
  );

  return <InboxRealtimeContext value={value}>{children}</InboxRealtimeContext>;
}

function useInboxRealtime(): InboxRealtimeContextValue {
  const value = use(InboxRealtimeContext);
  if (!value) {
    throw new Error("useInboxRealtime must be used inside RealtimeProvider");
  }
  return value;
}

/**
 * Tells the provider which conversation the inbox shows, so it skips browser notifications for it,
 * and lets a notification click open a conversation without reloading the inbox.
 */
export function useInboxPresence(
  openConversationId: string | null,
  onOpenRequest: OpenRequestHandler,
) {
  const { setOpenConversation, setOpenRequestHandler } = useInboxRealtime();
  const handlerRef = useRef(onOpenRequest);

  useEffect(() => {
    handlerRef.current = onOpenRequest;
  });

  useEffect(() => {
    setOpenConversation(openConversationId);
    return () => setOpenConversation(null);
  }, [openConversationId, setOpenConversation]);

  useEffect(() => {
    setOpenRequestHandler((id) => handlerRef.current(id));
    return () => setOpenRequestHandler(null);
  }, [setOpenRequestHandler]);
}
