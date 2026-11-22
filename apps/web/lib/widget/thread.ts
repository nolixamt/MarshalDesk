import type {
  WidgetConversation,
  WidgetMessage,
  WidgetThread,
} from "@marshaldesk/shared";

function byCreatedAt(a: WidgetMessage, b: WidgetMessage): number {
  return a.createdAt.localeCompare(b.createdAt);
}

/**
 * Events and responses arrive in any order: for the same conversation the newer snapshot wins.
 * Only one conversation is open at a time, so a different open one replaces a closed one, and
 * otherwise the later-updated one is the newer conversation.
 */
function newerConversation(
  cached: WidgetConversation | null | undefined,
  incoming: WidgetConversation,
): WidgetConversation {
  if (!cached) return incoming;
  const older = Date.parse(incoming.updatedAt) < Date.parse(cached.updatedAt);
  if (cached.id === incoming.id) return older ? cached : incoming;
  if (cached.state === "closed" && incoming.state !== "closed") return incoming;
  return older ? cached : incoming;
}

/** Adds what a send returned to the cached thread, keeping one copy of each message. */
export function mergeIntoThread(
  thread: WidgetThread | undefined,
  conversation: WidgetConversation,
  messages: WidgetMessage[],
): WidgetThread {
  const byId = new Map<string, WidgetMessage>();
  for (const message of thread?.messages ?? []) byId.set(message.id, message);
  for (const message of messages) byId.set(message.id, message);
  return {
    conversation: newerConversation(thread?.conversation, conversation),
    messages: [...byId.values()].sort(byCreatedAt),
  };
}

/** Adds one message that arrived live. Returns the same thread when it's already there. */
export function addMessageToThread(
  thread: WidgetThread | undefined,
  message: WidgetMessage,
): WidgetThread | undefined {
  if (!thread || thread.messages.some((entry) => entry.id === message.id)) {
    return thread;
  }
  return {
    conversation: thread.conversation,
    messages: [...thread.messages, message].sort(byCreatedAt),
  };
}

/** Updates the shown conversation. Changes to an earlier conversation are ignored. */
export function updateThreadConversation(
  thread: WidgetThread | undefined,
  conversation: WidgetConversation,
): WidgetThread | undefined {
  if (!thread || thread.conversation?.id !== conversation.id) return thread;
  const next = newerConversation(thread.conversation, conversation);
  if (next === thread.conversation) return thread;
  return { conversation: next, messages: thread.messages };
}

/** The member who last wrote in this conversation, for the typing indicator. */
export function latestMemberMessage(
  conversationId: string,
  messages: WidgetMessage[],
): WidgetMessage | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (
      message?.conversationId === conversationId &&
      message.author === "member"
    ) {
      return message;
    }
  }
  return null;
}

function latestMemberName(
  conversationId: string,
  messages: WidgetMessage[],
): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (
      message?.conversationId === conversationId &&
      message.author === "member" &&
      message.memberName
    ) {
      return message.memberName;
    }
  }
  return null;
}

export function widgetStatus(thread: WidgetThread | undefined): string {
  const conversation = thread?.conversation;
  if (!conversation) return "Here to help";
  switch (conversation.state) {
    case "ai":
    case "closed":
      return "Here to help";
    case "waiting":
      return "A person will join shortly";
    case "human": {
      const name = latestMemberName(conversation.id, thread.messages);
      return name
        ? `You're chatting with ${name}`
        : "You're chatting with a person";
    }
    default: {
      const unreachable: never = conversation.state;
      return unreachable;
    }
  }
}
