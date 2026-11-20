import "server-only";
import {
  getConversation,
  type ConversationWithVisitor,
  type MessageRow,
} from "@marshaldesk/db";
import type {
  ConversationRoomEvent,
  WorkspaceRoomEvent,
} from "@marshaldesk/shared";
import { after } from "next/server";
import {
  toConversation,
  toMessage,
  toWidgetConversation,
  toWidgetMessage,
} from "@/lib/conversations/mappers";
import {
  publishToConversation,
  publishToWorkspace,
} from "@/lib/realtime/publish";

// Publishing runs after the response is sent, and only ever after the write has committed.
function publishLater(task: () => Promise<void>) {
  after(async () => {
    try {
      await task();
    } catch (error) {
      console.error("Real-time publish failed", error);
    }
  });
}

async function sendConversationChange(
  conversation: ConversationWithVisitor,
  messages: MessageRow[],
) {
  const roomEvents: ConversationRoomEvent[] = [
    ...messages.map((message): ConversationRoomEvent => ({
      type: "message.created",
      message: toWidgetMessage(message),
    })),
    {
      type: "conversation.updated",
      conversation: toWidgetConversation(conversation),
    },
  ];
  const inbox = toConversation(conversation);
  const workspaceEvents: WorkspaceRoomEvent[] =
    messages.length > 0
      ? messages.map((message) => ({
          type: "inbox.message",
          conversation: inbox,
          message: toMessage(message),
        }))
      : [{ type: "inbox.conversation", conversation: inbox }];
  await Promise.all([
    publishToConversation(conversation.id, roomEvents),
    publishToWorkspace(conversation.workspaceId, workspaceEvents),
  ]);
}

/** A change to one conversation: its new state and the messages the change saved. */
export function publishConversationChange(
  conversation: ConversationWithVisitor,
  messages: MessageRow[],
) {
  publishLater(() => sendConversationChange(conversation, messages));
}

/** For writes that only have the bare conversation row: loads the visitor for the inbox payload. */
export function publishConversationChangeById(
  workspaceId: string,
  conversationId: string,
  messages: MessageRow[],
) {
  publishLater(async () => {
    const conversation = await getConversation(workspaceId, conversationId);
    if (conversation) await sendConversationChange(conversation, messages);
  });
}

/** Inbox-only changes, like the owner reading a conversation in another tab. */
export function publishInboxConversation(
  conversation: ConversationWithVisitor,
) {
  publishLater(() =>
    publishToWorkspace(conversation.workspaceId, [
      {
        type: "inbox.conversation",
        conversation: toConversation(conversation),
      },
    ]),
  );
}
