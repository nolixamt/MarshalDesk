"use client";

import {
  parseConversationRoomEvent,
  type ClientRoomMessage,
  type ConversationRoomEvent,
} from "@marshaldesk/shared";
import { usePartySocket } from "partysocket/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { client } from "@/lib/orpc/client";
import { REALTIME_HOST } from "@/lib/realtime/host";

// The visitor's widget sends a typing refresh while they type; this hides a stale indicator.
const VISITOR_TYPING_TIMEOUT_MS = 5_000;
const TYPING_REFRESH_MS = 2_000;
const TYPING_IDLE_MS = 3_000;
const IDLE_ROOM = "idle";

function parseEvent(data: unknown): ConversationRoomEvent | null {
  if (typeof data !== "string") return null;
  try {
    return parseConversationRoomEvent(JSON.parse(data));
  } catch {
    return null;
  }
}

/**
 * Joins one conversation's room for typing in both directions. Messages and state come from the
 * workspace room, which carries the inbox's richer payloads.
 */
export function useConversationRoom(conversationId: string | null) {
  const [typingIn, setTypingIn] = useState<string | null>(null);
  const hideTimer = useRef<number | null>(null);
  const idleTimer = useRef<number | null>(null);
  const lastSentAt = useRef(0);
  const sentTyping = useRef(false);

  const clearVisitorTyping = useCallback(() => {
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
    setTypingIn(null);
  }, []);

  function handleEvent(event: ConversationRoomEvent) {
    switch (event.type) {
      case "typing": {
        if (event.author !== "visitor" || !conversationId) return;
        if (!event.typing) {
          clearVisitorTyping();
          return;
        }
        setTypingIn(conversationId);
        if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(
          clearVisitorTyping,
          VISITOR_TYPING_TIMEOUT_MS,
        );
        return;
      }
      case "message.created":
        if (event.message.author === "visitor") clearVisitorTyping();
        return;
      case "conversation.updated":
        return;
      default: {
        const unhandled: never = event;
        return unhandled;
      }
    }
  }

  const socket = usePartySocket({
    host: REALTIME_HOST,
    party: "conversation",
    room: conversationId ?? IDLE_ROOM,
    enabled: conversationId !== null,
    query: async () => {
      if (!conversationId) return {};
      const { token } = await client.realtime.getToken({
        party: "conversation",
        conversationId,
      });
      return { token };
    },
    onMessage: (message) => {
      const event = parseEvent(message.data);
      if (event) handleEvent(event);
    },
  });

  const send = useCallback(
    (typing: boolean) => {
      // Typing is only meaningful now, so it's dropped rather than queued while disconnected.
      if (socket.readyState !== WebSocket.OPEN) return;
      const message: ClientRoomMessage = { type: "typing", typing };
      socket.send(JSON.stringify(message));
    },
    [socket],
  );

  const stopTyping = useCallback(() => {
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    idleTimer.current = null;
    lastSentAt.current = 0;
    if (!sentTyping.current) return;
    sentTyping.current = false;
    send(false);
  }, [send]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSentAt.current >= TYPING_REFRESH_MS) {
      lastSentAt.current = now;
      sentTyping.current = true;
      send(true);
    }
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(stopTyping, TYPING_IDLE_MS);
  }, [send, stopTyping]);

  useEffect(() => stopTyping, [conversationId, stopTyping]);

  useEffect(
    () => () => {
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    },
    [],
  );

  return {
    visitorTyping: conversationId !== null && typingIn === conversationId,
    notifyTyping,
    stopTyping,
  };
}
