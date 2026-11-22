import * as z from "zod";
import { accentColorSchema, widgetPositionSchema } from "./widget";
import {
  conversationStateSchema,
  MESSAGE_MAX_LENGTH,
  messageAuthorSchema,
  systemNoticeSchema,
} from "./inbox";

// What the widget (and so the visitor) may see. Never includes agent internals or visitor details.
export const widgetConfigSchema = z.object({
  workspaceId: z.uuid(),
  agentName: z.string(),
  agentAvatarUrl: z.string().nullable(),
  color: accentColorSchema,
  position: widgetPositionSchema,
  greeting: z.string(),
  agentOn: z.boolean(),
  suggestedQuestions: z.array(z.string()),
});
export type WidgetConfig = z.infer<typeof widgetConfigSchema>;

export const widgetHostSchema = z.string().trim().toLowerCase().min(1).max(253);

export const widgetConfigInputSchema = z.object({
  workspaceId: z.uuid(),
  host: widgetHostSchema,
});
export type WidgetConfigInput = z.infer<typeof widgetConfigInputSchema>;

const optionalDetail = (max: number) =>
  z.string().trim().max(max).nullable().catch(null);

// Reported by the visitor's browser; stored as-is, so only lengths are enforced.
export const widgetBrowserDetailsSchema = z.object({
  timezone: optionalDetail(64),
  language: optionalDetail(35),
  page: optionalDetail(2000),
  referrer: optionalDetail(2000),
});
export type WidgetBrowserDetails = z.infer<typeof widgetBrowserDetailsSchema>;

export const widgetStartInputSchema = widgetConfigInputSchema.extend({
  token: z.string().max(4000).nullable(),
  details: widgetBrowserDetailsSchema,
});
export type WidgetStartInput = z.infer<typeof widgetStartInputSchema>;

export const widgetSessionSchema = z.object({
  token: z.string(),
  visitorId: z.uuid(),
  config: widgetConfigSchema,
});
export type WidgetSession = z.infer<typeof widgetSessionSchema>;

export const widgetMessageSchema = z.object({
  id: z.uuid(),
  conversationId: z.uuid(),
  author: messageAuthorSchema,
  systemNotice: systemNoticeSchema.nullable(),
  memberName: z.string().nullable(),
  memberImageUrl: z.string().nullable(),
  body: z.string(),
  createdAt: z.iso.datetime(),
});
export type WidgetMessage = z.infer<typeof widgetMessageSchema>;

// The handoff reason is the owner's context and stays out of the widget.
export const widgetConversationSchema = z.object({
  id: z.uuid(),
  state: conversationStateSchema,
  updatedAt: z.iso.datetime(),
});
export type WidgetConversation = z.infer<typeof widgetConversationSchema>;

export const widgetThreadSchema = z.object({
  // The visitor's latest conversation; earlier ones only contribute messages.
  conversation: widgetConversationSchema.nullable(),
  messages: z.array(widgetMessageSchema),
});
export type WidgetThread = z.infer<typeof widgetThreadSchema>;

export const widgetSendMessageInputSchema = z.object({
  body: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH),
});
export type WidgetSendMessageInput = z.infer<
  typeof widgetSendMessageInputSchema
>;

export const widgetSendMessageOutputSchema = z.object({
  conversation: widgetConversationSchema,
  // Everything this send created, in order: the greeting and notices of a new conversation too.
  messages: z.array(widgetMessageSchema),
});
export type WidgetSendMessageOutput = z.infer<
  typeof widgetSendMessageOutputSchema
>;
