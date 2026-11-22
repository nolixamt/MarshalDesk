// Real-time events carried by the PartyServer Worker (apps/realtime). The Worker imports this file
// through the `@marshaldesk/shared/realtime` subpath, so it must only depend on Zod.
import * as z from "zod";
import { conversationSchema, messageSchema } from "./inbox";
import { widgetConversationSchema, widgetMessageSchema } from "./widget-chat";

export const REALTIME_TOKEN_AUDIENCE = "realtime";

export const realtimePartySchema = z.enum(["conversation", "workspace"]);
export type RealtimeParty = z.infer<typeof realtimePartySchema>;

export const realtimeRoleSchema = z.enum(["visitor", "owner"]);
export type RealtimeRole = z.infer<typeof realtimeRoleSchema>;

/** Claims of the short-lived token that opens a socket. The room is fixed by the token. */
export const realtimeTokenClaimsSchema = z.object({
  party: realtimePartySchema,
  room: z.uuid(),
  role: realtimeRoleSchema,
  wid: z.uuid(),
});
export type RealtimeTokenClaims = z.infer<typeof realtimeTokenClaimsSchema>;

export const typingAuthorSchema = z.enum(["visitor", "member"]);
export type TypingAuthor = z.infer<typeof typingAuthorSchema>;

// Conversation room: the visitor and any owner viewing it. Visitor-safe payloads only.
export const conversationRoomEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("message.created"),
    message: widgetMessageSchema,
  }),
  z.object({
    type: z.literal("conversation.updated"),
    conversation: widgetConversationSchema,
  }),
  z.object({
    type: z.literal("typing"),
    author: typingAuthorSchema,
    typing: z.boolean(),
  }),
]);
export type ConversationRoomEvent = z.infer<typeof conversationRoomEventSchema>;

// Workspace room: the owner's dashboard only (inbox list, messages, notifications).
export const workspaceRoomEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("inbox.message"),
    conversation: conversationSchema,
    message: messageSchema,
  }),
  z.object({
    type: z.literal("inbox.conversation"),
    conversation: conversationSchema,
  }),
]);
export type WorkspaceRoomEvent = z.infer<typeof workspaceRoomEventSchema>;

/** The only thing clients may send, and only in conversation rooms. */
export const clientRoomMessageSchema = z.object({
  type: z.literal("typing"),
  typing: z.boolean(),
});
export type ClientRoomMessage = z.infer<typeof clientRoomMessageSchema>;

export function parseConversationRoomEvent(
  data: unknown,
): ConversationRoomEvent | null {
  const parsed = conversationRoomEventSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export function parseWorkspaceRoomEvent(
  data: unknown,
): WorkspaceRoomEvent | null {
  const parsed = workspaceRoomEventSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export const realtimeTokenSchema = z.object({ token: z.string() });
export type RealtimeToken = z.infer<typeof realtimeTokenSchema>;

export const ownerRealtimeTokenInputSchema = z.discriminatedUnion("party", [
  z.object({ party: z.literal("workspace") }),
  z.object({ party: z.literal("conversation"), conversationId: z.uuid() }),
]);
export type OwnerRealtimeTokenInput = z.infer<
  typeof ownerRealtimeTokenInputSchema
>;

export const widgetRealtimeTokenInputSchema = z.object({
  // Defaults to the visitor's latest conversation.
  conversationId: z.uuid().nullable(),
});
export type WidgetRealtimeTokenInput = z.infer<
  typeof widgetRealtimeTokenInputSchema
>;

export const widgetRealtimeTokenSchema = z
  .object({ token: z.string(), conversationId: z.uuid() })
  .nullable();
export type WidgetRealtimeToken = z.infer<typeof widgetRealtimeTokenSchema>;
