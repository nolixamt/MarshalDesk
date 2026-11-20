import * as z from "zod";

export const conversationStateSchema = z.enum([
  "ai",
  "waiting",
  "human",
  "closed",
]);
export type ConversationState = z.infer<typeof conversationStateSchema>;

export const openConversationStates = [
  "ai",
  "waiting",
  "human",
] as const satisfies readonly ConversationState[];

export const handoffReasonSchema = z.enum([
  "low_confidence",
  "no_relevant_knowledge",
  "visitor_requested",
  "agent_off",
]);
export type HandoffReason = z.infer<typeof handoffReasonSchema>;

export const classificationSchema = z.enum([
  "support_question",
  "small_talk",
  "off_topic",
  "human_request",
]);
export type Classification = z.infer<typeof classificationSchema>;

export const messageAuthorSchema = z.enum([
  "visitor",
  "agent",
  "member",
  "system",
]);
export type MessageAuthor = z.infer<typeof messageAuthorSchema>;

export const systemNoticeSchema = z.enum([
  "greeting",
  "agent_off",
  "hand_back",
  "closed",
]);
export type SystemNotice = z.infer<typeof systemNoticeSchema>;

export const AGENT_OFF_NOTICE =
  "You'll be connected to a person shortly. It can take a little while, so please hang on.";
export const HAND_BACK_NOTICE = "You're now chatting with the AI agent.";
export const CLOSED_NOTICE =
  "This conversation has ended. Send a message to start a new one.";

export const MESSAGE_MAX_LENGTH = 4000;

export const visitorDetailsSchema = z.object({
  country: z.string().nullable(),
  city: z.string().nullable(),
  timezone: z.string().nullable(),
  language: z.string().nullable(),
  device: z.string().nullable(),
  browser: z.string().nullable(),
  os: z.string().nullable(),
  page: z.string().nullable(),
  referrer: z.string().nullable(),
  visitCount: z.number().int().nonnegative(),
});
export type VisitorDetails = z.infer<typeof visitorDetailsSchema>;

export const visitorSchema = z.object({
  id: z.string(),
  details: visitorDetailsSchema,
  firstSeenAt: z.iso.datetime(),
  lastSeenAt: z.iso.datetime(),
});
export type Visitor = z.infer<typeof visitorSchema>;

export const retrievedChunkSchema = z.object({
  chunkId: z.string(),
  sourceName: z.string(),
  score: z.number(),
  used: z.boolean(),
});
export type RetrievedChunk = z.infer<typeof retrievedChunkSchema>;

export const agentTurnSchema = z.object({
  id: z.string(),
  classification: classificationSchema.nullable(),
  outcome: z.enum(["answered", "declined", "small_talk", "handed_off"]),
  chunks: z.array(retrievedChunkSchema),
  model: z.string().nullable(),
  tokensIn: z.number().int().nonnegative(),
  tokensOut: z.number().int().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
});
export type AgentTurn = z.infer<typeof agentTurnSchema>;

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  author: messageAuthorSchema,
  systemNotice: systemNoticeSchema.nullable(),
  memberName: z.string().nullable(),
  memberImageUrl: z.string().nullable(),
  body: z.string(),
  classification: classificationSchema.nullable(),
  declined: z.boolean(),
  sourceNames: z.array(z.string()),
  agentTurn: agentTurnSchema.nullable(),
  createdAt: z.iso.datetime(),
});
export type Message = z.infer<typeof messageSchema>;

export const conversationSchema = z.object({
  id: z.string(),
  visitor: visitorSchema,
  state: conversationStateSchema,
  handoffReason: handoffReasonSchema.nullable(),
  lastMessagePreview: z.string(),
  lastMessageAt: z.iso.datetime(),
  unread: z.boolean(),
  createdAt: z.iso.datetime(),
  closedAt: z.iso.datetime().nullable(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const replyInputSchema = z.object({
  body: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH),
});
export type ReplyInput = z.infer<typeof replyInputSchema>;

export const conversationIdInputSchema = z.object({ id: z.uuid() });
export type ConversationIdInput = z.infer<typeof conversationIdInputSchema>;

export const inboxReplyInputSchema = conversationIdInputSchema.extend(
  replyInputSchema.shape,
);
export type InboxReplyInput = z.infer<typeof inboxReplyInputSchema>;

export const conversationWithMessagesSchema = z.object({
  conversation: conversationSchema,
  messages: z.array(messageSchema),
});
export type ConversationWithMessages = z.infer<
  typeof conversationWithMessagesSchema
>;

export const conversationChangeSchema = z.object({
  conversation: conversationSchema,
  message: messageSchema.nullable(),
});
export type ConversationChange = z.infer<typeof conversationChangeSchema>;
