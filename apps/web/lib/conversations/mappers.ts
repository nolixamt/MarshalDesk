import "server-only";
import type {
  ConversationRow,
  ConversationWithVisitor,
  MessageRow,
  VisitorRow,
} from "@marshaldesk/db";
import type {
  Conversation,
  Message,
  Visitor,
  WidgetConversation,
  WidgetMessage,
} from "@marshaldesk/shared";

export function toVisitor(row: VisitorRow): Visitor {
  return {
    id: row.id,
    details: {
      country: row.country,
      city: row.city,
      timezone: row.timezone,
      language: row.language,
      device: row.device,
      browser: row.browser,
      os: row.os,
      page: row.page,
      referrer: row.referrer,
      visitCount: row.visitCount,
    },
    firstSeenAt: row.firstSeenAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
  };
}

export function toConversation(row: ConversationWithVisitor): Conversation {
  return {
    id: row.id,
    visitor: toVisitor(row.visitor),
    state: row.state,
    handoffReason: row.handoffReason,
    lastMessagePreview: row.lastMessagePreview,
    lastMessageAt: row.lastMessageAt.toISOString(),
    unread: row.unread,
    createdAt: row.createdAt.toISOString(),
    closedAt: row.closedAt?.toISOString() ?? null,
  };
}

export function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversationId,
    author: row.author,
    systemNotice: row.systemNotice,
    memberName: row.memberName,
    memberImageUrl: row.memberImageUrl,
    body: row.body,
    classification: null,
    declined: false,
    sourceNames: [],
    agentTurn: null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toWidgetConversation(row: ConversationRow): WidgetConversation {
  return { id: row.id, state: row.state, handoffReason: row.handoffReason };
}

export function toWidgetMessage(row: MessageRow): WidgetMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    author: row.author,
    systemNotice: row.systemNotice,
    memberName: row.memberName,
    memberImageUrl: row.memberImageUrl,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}
