"use client";

import {
  parseConversationRoomEvent,
  type ClientRoomMessage,
  type WidgetThread,
} from "@marshaldesk/shared";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { usePartySocket } from "partysocket/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { playNotificationSound } from "@/lib/notification-sound";
import { REALTIME_HOST } from "@/lib/realtime/host";
import { widgetClient, withVisitor } from "@/lib/widget/client";
import {
  addMessageToThread,
  updateThreadConversation,
} from "@/lib/widget/thread";

const TYPING_REFRESH_MS = 2_000;
const TYPING_IDLE_MS = 3_000;
const MEMBER_TYPING_TIMEOUT_MS = 5_000;

function readJson(data: unknown): unknown {
  if (typeof data !== "string") return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Keeps the cached thread live through the conversation's room, and carries typing both ways.
 * The socket only delivers: every (re)open refetches the thread to catch up on what it missed.
 */
export function useConversationRoom({
  conversationId,
  enabled,
  threadKey,
}: {
  conversationId: string | null;
  enabled: boolean;
  threadKey: QueryKey;
}) {
  const queryClient = useQueryClient();
  const [memberTyping, setMemberTyping] = useState(false);
  const memberTypingTimer = useRef<number | null>(null);
  const typingSent = useRef(false);
  const typingSentAt = useRef(0);
  const typingIdleTimer = useRef<number | null>(null);

  const writeThread = useCallback(
    async (
      update: (thread: WidgetThread | undefined) => WidgetThread | undefined,
    ) => {
      // A fetch that started before this event would overwrite it, so it's restarted afterwards.
      const fetching = queryClient.isFetching({ queryKey: threadKey }) > 0;
      if (fetching) await queryClient.cancelQueries({ queryKey: threadKey });
      queryClient.setQueryData<WidgetThread>(threadKey, update);
      if (fetching) void queryClient.invalidateQueries({ queryKey: threadKey });
    },
    [queryClient, threadKey],
  );

  const clearMemberTyping = useCallback(() => {
    if (memberTypingTimer.current !== null) {
      window.clearTimeout(memberTypingTimer.current);
      memberTypingTimer.current = null;
    }
    setMemberTyping(false);
  }, []);

  const socket = usePartySocket({
    host: REALTIME_HOST,
    party: "conversation",
    room: conversationId ?? "none",
    enabled: enabled && conversationId !== null,
    // The socket is rebuilt per room, so this closure always asks for the room it opens.
    query: async () => {
      const result = await withVisitor(() =>
        widgetClient.widget.getRealtimeToken({ conversationId }),
      );
      if (!result) throw new Error("No conversation to follow yet");
      return { token: result.token };
    },
    onOpen: () => {
      void queryClient.invalidateQueries({ queryKey: threadKey });
    },
    onMessage: (event) => {
      const roomEvent = parseConversationRoomEvent(readJson(event.data));
      if (!roomEvent) return;
      switch (roomEvent.type) {
        case "message.created": {
          const { message } = roomEvent;
          const known = queryClient
            .getQueryData<WidgetThread>(threadKey)
            ?.messages.some((entry) => entry.id === message.id);
          if (message.author === "member") {
            clearMemberTyping();
            if (!known && document.hidden) playNotificationSound();
          }
          void writeThread((thread) => addMessageToThread(thread, message));
          return;
        }
        case "conversation.updated":
          void writeThread((thread) =>
            updateThreadConversation(thread, roomEvent.conversation),
          );
          return;
        case "typing":
          switch (roomEvent.author) {
            case "visitor":
              return;
            case "member":
              if (memberTypingTimer.current !== null) {
                window.clearTimeout(memberTypingTimer.current);
                memberTypingTimer.current = null;
              }
              if (!roomEvent.typing) {
                setMemberTyping(false);
                return;
              }
              setMemberTyping(true);
              memberTypingTimer.current = window.setTimeout(
                clearMemberTyping,
                MEMBER_TYPING_TIMEOUT_MS,
              );
              return;
            default: {
              const unreachable: never = roomEvent.author;
              return unreachable;
            }
          }
        default: {
          const unreachable: never = roomEvent;
          return unreachable;
        }
      }
    },
  });

  const sendTyping = useCallback(
    (typing: boolean) => {
      typingSent.current = typing;
      typingSentAt.current = typing ? Date.now() : 0;
      // Typing is momentary: never queue it for a socket that isn't open.
      if (socket.readyState !== WebSocket.OPEN) return;
      const message: ClientRoomMessage = { type: "typing", typing };
      socket.send(JSON.stringify(message));
    },
    [socket],
  );

  const stopTyping = useCallback(() => {
    if (typingIdleTimer.current !== null) {
      window.clearTimeout(typingIdleTimer.current);
      typingIdleTimer.current = null;
    }
    if (typingSent.current) sendTyping(false);
  }, [sendTyping]);

  const onDraftChange = useCallback(
    (value: string) => {
      if (value.trim().length === 0) {
        stopTyping();
        return;
      }
      if (
        !typingSent.current ||
        Date.now() - typingSentAt.current >= TYPING_REFRESH_MS
      ) {
        sendTyping(true);
      }
      if (typingIdleTimer.current !== null) {
        window.clearTimeout(typingIdleTimer.current);
      }
      typingIdleTimer.current = window.setTimeout(stopTyping, TYPING_IDLE_MS);
    },
    [sendTyping, stopTyping],
  );

  useEffect(() => {
    return () => {
      if (typingIdleTimer.current !== null) {
        window.clearTimeout(typingIdleTimer.current);
        typingIdleTimer.current = null;
      }
      typingSent.current = false;
      if (memberTypingTimer.current !== null) {
        window.clearTimeout(memberTypingTimer.current);
        memberTypingTimer.current = null;
      }
      setMemberTyping(false);
    };
  }, [conversationId]);

  return { memberTyping, onDraftChange, stopTyping };
}
