"use client";

import type { ConversationChange, Message } from "@marshaldesk/shared";
import { isDefinedError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import {
  appendMessage,
  applyConversationChange,
  patchConversation,
  pendingMessageId,
  refetchConversation,
  removeMessage,
} from "@/lib/inbox/cache";
import { orpc } from "@/lib/orpc/client";

import { transition } from "./transitions";

export type ActionNotice = { conversationId: string; text: string };

export type ReplyAuthor = { name: string; imageUrl: string | null };

function noticeFor<TError>(error: TError, fallback: string): string {
  if (isDefinedError(error)) {
    if (error.code === "TRANSITION_NOT_ALLOWED") {
      return "This conversation changed in the meantime, so it's up to date now.";
    }
    if (error.code === "CONVERSATION_NOT_FOUND") {
      return "This conversation doesn't exist anymore.";
    }
  }
  return fallback;
}

export function useConversationActions(author: ReplyAuthor) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);

  function onSuccess(change: ConversationChange) {
    applyConversationChange(queryClient, change);
  }

  function onError<TError>(
    conversationId: string,
    error: TError,
    fallback: string,
  ) {
    void refetchConversation(queryClient, conversationId);
    setNotice({ conversationId, text: noticeFor(error, fallback) });
  }

  const takeOver = useMutation(
    orpc.inbox.takeOver.mutationOptions({
      onSuccess,
      onError: (error, { id }) =>
        onError(id, error, "Couldn't take over. Try again."),
    }),
  );
  const handBack = useMutation(
    orpc.inbox.handBack.mutationOptions({
      onSuccess,
      onError: (error, { id }) =>
        onError(id, error, "Couldn't hand this to the agent. Try again."),
    }),
  );
  const close = useMutation(
    orpc.inbox.close.mutationOptions({
      onSuccess,
      onError: (error, { id }) =>
        onError(id, error, "Couldn't close this conversation. Try again."),
    }),
  );
  const reply = useMutation(
    orpc.inbox.reply.mutationOptions({
      onMutate: async ({ id, body }) => {
        const key = orpc.inbox.get.queryKey({ input: { id } });
        const detail = queryClient.getQueryData(key);
        // Without loaded history there's nothing to append to, and cancelling would drop the first load.
        if (!detail) return null;
        await queryClient.cancelQueries({ queryKey: key });
        const createdAt = new Date().toISOString();
        const pending: Message = {
          id: pendingMessageId(),
          conversationId: id,
          author: "member",
          systemNotice: null,
          memberName: author.name,
          memberImageUrl: author.imageUrl,
          body,
          classification: null,
          declined: false,
          sourceNames: [],
          agentTurn: null,
          createdAt,
        };
        appendMessage(queryClient, pending);
        const next = transition(detail.conversation.state, "reply");
        if (next) {
          patchConversation(queryClient, id, {
            state: next,
            lastMessagePreview: body,
            lastMessageAt: createdAt,
          });
        }
        return { pendingId: pending.id };
      },
      onSuccess: (change, { id }, result) => {
        if (result) removeMessage(queryClient, id, result.pendingId);
        onSuccess(change);
      },
      onError: (error, { id }, result) => {
        if (result) removeMessage(queryClient, id, result.pendingId);
        onError(id, error, "Your reply wasn't sent. Try again.");
      },
    }),
  );

  const pending =
    takeOver.isPending ||
    handBack.isPending ||
    close.isPending ||
    reply.isPending;

  return {
    pending,
    notice,
    dismissNotice,
    takeOver: (id: string) => takeOver.mutate({ id }),
    handBack: (id: string) => handBack.mutate({ id }),
    close: (id: string) => close.mutate({ id }),
    reply: (id: string, body: string) => reply.mutateAsync({ id, body }),
  };
}
