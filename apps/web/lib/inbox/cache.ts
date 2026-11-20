import type {
  Conversation,
  ConversationChange,
  Message,
} from "@marshaldesk/shared";
import type { QueryClient } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc/client";

const PENDING_PREFIX = "pending-";

export function inboxListKey() {
  return orpc.inbox.list.queryKey();
}

export function conversationKey(id: string) {
  return orpc.inbox.get.queryKey({ input: { id } });
}

export function upsertConversation(
  queryClient: QueryClient,
  conversation: Conversation,
): void {
  queryClient.setQueryData(inboxListKey(), (list) => {
    if (!list) return list;
    if (!list.some((c) => c.id === conversation.id)) {
      return [conversation, ...list];
    }
    return list.map((c) => (c.id === conversation.id ? conversation : c));
  });
  queryClient.setQueryData(conversationKey(conversation.id), (detail) =>
    detail ? { ...detail, conversation } : detail,
  );
}

export function patchConversation(
  queryClient: QueryClient,
  id: string,
  patch: Partial<Omit<Conversation, "id">>,
): void {
  queryClient.setQueryData(inboxListKey(), (list) =>
    list?.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  );
  queryClient.setQueryData(conversationKey(id), (detail) =>
    detail
      ? { ...detail, conversation: { ...detail.conversation, ...patch } }
      : detail,
  );
}

export function appendMessage(
  queryClient: QueryClient,
  message: Message,
): void {
  queryClient.setQueryData(
    conversationKey(message.conversationId),
    (detail) => {
      if (!detail || detail.messages.some((m) => m.id === message.id)) {
        return detail;
      }
      return { ...detail, messages: [...detail.messages, message] };
    },
  );
}

/** A message from the real-time feed: replaces the optimistic copy of the owner's own reply. */
export function receiveMessage(
  queryClient: QueryClient,
  message: Message,
): void {
  queryClient.setQueryData(
    conversationKey(message.conversationId),
    (detail) => {
      if (!detail || detail.messages.some((m) => m.id === message.id)) {
        return detail;
      }
      const pendingIndex =
        message.author === "member"
          ? detail.messages.findIndex(
              (m) => isPendingMessage(m) && m.body === message.body,
            )
          : -1;
      const messages =
        pendingIndex === -1
          ? detail.messages
          : detail.messages.filter((_, index) => index !== pendingIndex);
      return { ...detail, messages: [...messages, message] };
    },
  );
}

export function isPendingMessage(message: Message): boolean {
  return message.id.startsWith(PENDING_PREFIX);
}

export function pendingMessageId(): string {
  return `${PENDING_PREFIX}${crypto.randomUUID()}`;
}

/** Marks every inbox query stale and refetches the ones on screen. */
export function resyncInbox(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: orpc.inbox.key() });
}

export function removeMessage(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
): void {
  queryClient.setQueryData(conversationKey(conversationId), (detail) =>
    detail
      ? {
          ...detail,
          messages: detail.messages.filter((m) => m.id !== messageId),
        }
      : detail,
  );
}

export function applyConversationChange(
  queryClient: QueryClient,
  change: ConversationChange,
): void {
  upsertConversation(queryClient, change.conversation);
  if (change.message) appendMessage(queryClient, change.message);
}

export function refetchConversation(
  queryClient: QueryClient,
  id: string,
): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: inboxListKey() }),
    queryClient.invalidateQueries({ queryKey: conversationKey(id) }),
  ]).then(() => undefined);
}
