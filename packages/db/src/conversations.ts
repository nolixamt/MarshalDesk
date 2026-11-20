import {
  SqlQueryError,
  isUniqueConstraintViolation,
} from "@prisma/orm-family-sql/errors";
import { db } from "./prisma/db";
import type { VisitorRow } from "./visitors";

export type ConversationStateValue = "ai" | "waiting" | "human" | "closed";
export type HandoffReasonValue =
  | "low_confidence"
  | "no_relevant_knowledge"
  | "visitor_requested"
  | "agent_off";
export type MessageAuthorValue = "visitor" | "agent" | "member" | "system";
export type SystemNoticeValue =
  "greeting" | "agent_off" | "hand_back" | "closed";

export type ConversationRow = {
  id: string;
  workspaceId: string;
  visitorId: string;
  state: ConversationStateValue;
  handoffReason: HandoffReasonValue | null;
  unread: boolean;
  lastMessagePreview: string;
  lastMessageAt: Date;
  createdAt: Date;
  closedAt: Date | null;
};

export type ConversationWithVisitor = ConversationRow & { visitor: VisitorRow };

export type MessageRow = {
  id: string;
  workspaceId: string;
  conversationId: string;
  author: MessageAuthorValue;
  systemNotice: SystemNoticeValue | null;
  memberId: string | null;
  memberName: string | null;
  memberImageUrl: string | null;
  body: string;
  createdAt: Date;
};

const OPEN_STATES = ["ai", "waiting", "human"] as const;
const ONE_OPEN_PER_VISITOR = "conversations_one_open_per_visitor";
const PREVIEW_LENGTH = 140;
const INBOX_LIMIT = 200;
const THREAD_MESSAGE_LIMIT = 200;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function preview(body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > PREVIEW_LENGTH
    ? `${flat.slice(0, PREVIEW_LENGTH - 1)}…`
    : flat;
}

function isOneOpenConflict(error: unknown): boolean {
  for (
    let current: unknown = error;
    current instanceof Error;
    current = current.cause
  ) {
    if (SqlQueryError.is(current) && isUniqueConstraintViolation(current)) {
      return (
        current.constraint === undefined ||
        current.constraint.startsWith(ONE_OPEN_PER_VISITOR)
      );
    }
  }
  return false;
}

// Messages written in one transaction would share now(); explicit, increasing times keep their order.
function after(base: Date, milliseconds: number): Date {
  return new Date(base.getTime() + milliseconds);
}

type NewMessage = {
  author: MessageAuthorValue;
  body: string;
  systemNotice?: SystemNoticeValue;
  member?: { id: string; name: string; imageUrl: string | null };
};

async function insertMessage(
  tx: Tx,
  conversation: { id: string; workspaceId: string },
  message: NewMessage,
  createdAt: Date,
): Promise<MessageRow> {
  return tx.orm.public.Message.create({
    workspaceId: conversation.workspaceId,
    conversationId: conversation.id,
    author: message.author,
    systemNotice: message.systemNotice ?? null,
    memberId: message.member?.id ?? null,
    memberName: message.member?.name ?? null,
    memberImageUrl: message.member?.imageUrl ?? null,
    body: message.body,
    createdAt,
  });
}

// ---------------------------------------------------------------- widget (visitor) side

export async function findLatestConversation(
  workspaceId: string,
  visitorId: string,
): Promise<ConversationRow | null> {
  const row = await db.orm.public.Conversation.where({ workspaceId, visitorId })
    .orderBy([(c) => c.createdAt.desc(), (c) => c.id.desc()])
    .first();
  return row ?? null;
}

export async function findVisitorConversation(
  workspaceId: string,
  visitorId: string,
  conversationId: string,
): Promise<ConversationRow | null> {
  const row = await db.orm.public.Conversation.where({
    id: conversationId,
    workspaceId,
    visitorId,
  }).first();
  return row ?? null;
}

/** The visitor's recent messages across all their conversations, oldest first. */
export async function listVisitorMessages(
  workspaceId: string,
  visitorId: string,
): Promise<MessageRow[]> {
  const conversations = await db.orm.public.Conversation.where({
    workspaceId,
    visitorId,
  })
    .select("id")
    .all();
  if (conversations.length === 0) return [];
  const ids = conversations.map((c) => c.id);
  const newestFirst = await db.orm.public.Message.where({ workspaceId })
    .where((m) => m.conversationId.in(ids))
    .orderBy([(m) => m.createdAt.desc(), (m) => m.id.desc()])
    .limit(THREAD_MESSAGE_LIMIT)
    .all();
  return [...newestFirst].reverse();
}

export type VisitorMessageResult = {
  conversation: ConversationRow;
  messages: MessageRow[];
  created: boolean;
};

/**
 * Saves a visitor message. Without an open conversation it starts one, with the greeting saved as
 * its first message; while the agent is off a new conversation starts waiting (Flow C).
 */
export async function saveVisitorMessage(input: {
  workspaceId: string;
  visitorId: string;
  body: string;
  greeting: string;
  agentOn: boolean;
  agentOffNotice: string;
}): Promise<VisitorMessageResult> {
  try {
    return await saveVisitorMessageOnce(input);
  } catch (error) {
    // Two first messages raced to create the conversation; the loser joins the winner's.
    if (!isOneOpenConflict(error)) throw error;
    return saveVisitorMessageOnce(input);
  }
}

async function saveVisitorMessageOnce(input: {
  workspaceId: string;
  visitorId: string;
  body: string;
  greeting: string;
  agentOn: boolean;
  agentOffNotice: string;
}): Promise<VisitorMessageResult> {
  return db.transaction(async (tx) => {
    const open = await tx.orm.public.Conversation.where({
      workspaceId: input.workspaceId,
      visitorId: input.visitorId,
    })
      .where((c) => c.state.in([...OPEN_STATES]))
      .forUpdate()
      .first();

    if (open) {
      const message = await insertMessage(
        tx,
        open,
        { author: "visitor", body: input.body },
        new Date(),
      );
      const conversation = await tx.orm.public.Conversation.where({
        id: open.id,
        workspaceId: input.workspaceId,
      }).update({
        unread: true,
        lastMessagePreview: preview(input.body),
        lastMessageAt: message.createdAt,
      });
      if (!conversation) throw new Error("Open conversation disappeared");
      return { conversation, messages: [message], created: false };
    }

    const created = await tx.orm.public.Conversation.create({
      workspaceId: input.workspaceId,
      visitorId: input.visitorId,
      state: input.agentOn ? "ai" : "waiting",
      handoffReason: input.agentOn ? null : "agent_off",
      unread: true,
      lastMessagePreview: preview(input.body),
    });
    const now = new Date();
    const greeting = await insertMessage(
      tx,
      created,
      { author: "system", systemNotice: "greeting", body: input.greeting },
      now,
    );
    const visitorMessage = await insertMessage(
      tx,
      created,
      { author: "visitor", body: input.body },
      after(now, 1),
    );
    const messages = [greeting, visitorMessage];
    if (!input.agentOn) {
      messages.push(
        await insertMessage(
          tx,
          created,
          {
            author: "system",
            systemNotice: "agent_off",
            body: input.agentOffNotice,
          },
          after(now, 2),
        ),
      );
    }
    const conversation = await tx.orm.public.Conversation.where({
      id: created.id,
      workspaceId: input.workspaceId,
    }).update({ lastMessageAt: visitorMessage.createdAt });
    if (!conversation) throw new Error("New conversation disappeared");
    return { conversation, messages, created: true };
  });
}

/** Visitor asks for a person: ai → waiting. Returns null when the state doesn't allow it. */
export async function requestHuman(
  workspaceId: string,
  visitorId: string,
): Promise<ConversationRow | null> {
  const row = await db.orm.public.Conversation.where({
    workspaceId,
    visitorId,
    state: "ai",
  }).update({ state: "waiting", handoffReason: "visitor_requested" });
  return row ?? null;
}

// ---------------------------------------------------------------- inbox (owner) side

export async function listConversations(
  workspaceId: string,
): Promise<ConversationWithVisitor[]> {
  return db.orm.public.Conversation.where({ workspaceId })
    .include("visitor")
    .orderBy([(c) => c.lastMessageAt.desc(), (c) => c.id.desc()])
    .limit(INBOX_LIMIT)
    .all();
}

export async function getConversation(
  workspaceId: string,
  conversationId: string,
): Promise<ConversationWithVisitor | null> {
  const row = await db.orm.public.Conversation.where({
    id: conversationId,
    workspaceId,
  })
    .include("visitor")
    .first();
  return row ?? null;
}

export async function listMessages(
  workspaceId: string,
  conversationId: string,
): Promise<MessageRow[]> {
  return db.orm.public.Message.where({ workspaceId, conversationId })
    .orderBy([(m) => m.createdAt.asc(), (m) => m.id.asc()])
    .all();
}

export async function markConversationRead(
  workspaceId: string,
  conversationId: string,
): Promise<ConversationWithVisitor | null> {
  await db.orm.public.Conversation.where({
    id: conversationId,
    workspaceId,
  }).updateAndCount({ unread: false });
  return getConversation(workspaceId, conversationId);
}

export type TransitionResult =
  | {
      ok: true;
      conversation: ConversationWithVisitor;
      message: MessageRow | null;
    }
  | { ok: false; reason: "not_found" | "not_allowed" };

async function afterGuardedUpdate(
  workspaceId: string,
  conversationId: string,
  updated: boolean,
  message: MessageRow | null,
): Promise<TransitionResult> {
  const conversation = await getConversation(workspaceId, conversationId);
  if (!conversation) return { ok: false, reason: "not_found" };
  if (!updated) return { ok: false, reason: "not_allowed" };
  return { ok: true, conversation, message };
}

/**
 * The owner's reply. In ai or waiting it takes the conversation over, in the same statement that
 * guards the state, so a reply racing a close can't reopen it.
 */
export async function saveMemberReply(input: {
  workspaceId: string;
  conversationId: string;
  member: { id: string; name: string; imageUrl: string | null };
  body: string;
}): Promise<TransitionResult> {
  const message = await db.transaction(async (tx) => {
    const now = new Date();
    const conversation = await tx.orm.public.Conversation.where({
      id: input.conversationId,
      workspaceId: input.workspaceId,
    })
      .where((c) => c.state.in([...OPEN_STATES]))
      .update({
        state: "human",
        lastMessagePreview: preview(input.body),
        lastMessageAt: now,
      });
    if (!conversation) return null;
    return insertMessage(
      tx,
      conversation,
      { author: "member", body: input.body, member: input.member },
      now,
    );
  });
  return afterGuardedUpdate(
    input.workspaceId,
    input.conversationId,
    message !== null,
    message,
  );
}

export async function takeOverConversation(
  workspaceId: string,
  conversationId: string,
): Promise<TransitionResult> {
  const updated = await db.orm.public.Conversation.where({
    id: conversationId,
    workspaceId,
  })
    .where((c) => c.state.in(["ai", "waiting"]))
    .updateAndCount({ state: "human" });
  return afterGuardedUpdate(workspaceId, conversationId, updated > 0, null);
}

export async function handBackConversation(
  workspaceId: string,
  conversationId: string,
  noticeBody: string,
): Promise<TransitionResult> {
  const message = await db.transaction(async (tx) => {
    const conversation = await tx.orm.public.Conversation.where({
      id: conversationId,
      workspaceId,
      state: "human",
    }).update({ state: "ai", handoffReason: null });
    if (!conversation) return null;
    return insertMessage(
      tx,
      conversation,
      { author: "system", systemNotice: "hand_back", body: noticeBody },
      new Date(),
    );
  });
  return afterGuardedUpdate(
    workspaceId,
    conversationId,
    message !== null,
    message,
  );
}

export async function closeConversation(
  workspaceId: string,
  conversationId: string,
  noticeBody: string,
): Promise<TransitionResult> {
  const message = await db.transaction(async (tx) => {
    const conversation = await tx.orm.public.Conversation.where({
      id: conversationId,
      workspaceId,
    })
      .where((c) => c.state.in([...OPEN_STATES]))
      .update({ state: "closed", closedAt: new Date() });
    if (!conversation) return null;
    return insertMessage(
      tx,
      conversation,
      { author: "system", systemNotice: "closed", body: noticeBody },
      new Date(),
    );
  });
  return afterGuardedUpdate(
    workspaceId,
    conversationId,
    message !== null,
    message,
  );
}
