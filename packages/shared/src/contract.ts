import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";
import * as z from "zod";
import { workspaceNameSchema } from "./auth";
import {
  avatarUploadSchema,
  confirmAvatarUploadInputSchema,
  createAvatarUploadInputSchema,
  widgetSettingsPatchSchema,
  widgetSettingsStateSchema,
} from "./widget";
import {
  conversationChangeSchema,
  conversationIdInputSchema,
  conversationSchema,
  conversationWithMessagesSchema,
  inboxReplyInputSchema,
} from "./inbox";
import {
  widgetConfigInputSchema,
  widgetConfigSchema,
  widgetConversationSchema,
  widgetSendMessageInputSchema,
  widgetSendMessageOutputSchema,
  widgetSessionSchema,
  widgetStartInputSchema,
  widgetThreadSchema,
} from "./widget-chat";
import {
  ownerRealtimeTokenInputSchema,
  realtimeTokenSchema,
  widgetRealtimeTokenInputSchema,
  widgetRealtimeTokenSchema,
} from "./realtime";

export const healthSchema = z.object({
  status: z.literal("ok"),
  time: z.iso.datetime(),
});
export type Health = z.infer<typeof healthSchema>;

export const workspaceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});
export type Workspace = z.infer<typeof workspaceSchema>;

export const ownerUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.string().nullable(),
});
export type OwnerUser = z.infer<typeof ownerUserSchema>;

export const currentOwnerSchema = z.object({
  user: ownerUserSchema,
  workspace: workspaceSchema,
});
export type CurrentOwner = z.infer<typeof currentOwnerSchema>;

export const createWorkspaceInputSchema = z.object({
  name: workspaceNameSchema,
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceInputSchema>;

const signedIn = oc.errors({
  UNAUTHORIZED: { message: "Sign in to continue." },
  EMAIL_NOT_VERIFIED: { message: "Verify your email to continue." },
});

const ownerOnly = signedIn.errors({
  WORKSPACE_REQUIRED: { message: "Create your workspace to continue." },
});

const avatarErrors = ownerOnly.errors({
  AVATAR_INVALID: {
    message: "Use a PNG, JPEG, WebP or GIF image up to 2 MB.",
  },
});

const conversationErrors = ownerOnly.errors({
  CONVERSATION_NOT_FOUND: { message: "This conversation doesn't exist." },
  TRANSITION_NOT_ALLOWED: {
    message: "This conversation has moved on. Refresh to see where it is now.",
  },
});

// Public widget calls: anyone on an allowed domain may make them.
const widgetPublic = oc.errors({
  WIDGET_NOT_FOUND: { message: "This widget doesn't exist." },
  DOMAIN_NOT_ALLOWED: { message: "The widget isn't allowed on this website." },
});

// visitorProcedure: needs the visitor token issued by widget.start.
const visitorOnly = oc.errors({
  VISITOR_UNAUTHORIZED: { message: "Start a new widget session." },
});

export const contract = {
  health: {
    ping: oc
      .meta(
        openapi({
          method: "GET",
          path: "/health",
          summary: "Check that the API is up",
          tags: ["Health"],
        }),
      )
      .output(healthSchema),
  },
  owner: {
    getCurrent: ownerOnly
      .meta(
        openapi({
          method: "GET",
          path: "/owner",
          summary: "Get the signed-in owner and their workspace",
          tags: ["Owner"],
        }),
      )
      .output(currentOwnerSchema),
  },
  workspace: {
    // Idempotent per owner: a second call returns the existing workspace.
    create: signedIn
      .meta(
        openapi({
          method: "POST",
          path: "/workspace",
          summary: "Create the signed-in owner's workspace",
          tags: ["Workspace"],
        }),
      )
      .input(createWorkspaceInputSchema)
      .output(workspaceSchema),
  },
  widgetSettings: {
    get: ownerOnly
      .meta(
        openapi({
          method: "GET",
          path: "/widget-settings",
          summary: "Get the widget settings and setup progress",
          tags: ["Widget settings"],
        }),
      )
      .output(widgetSettingsStateSchema),
    // A partial patch: only the fields sent are changed.
    update: ownerOnly
      .meta(
        openapi({
          method: "PATCH",
          path: "/widget-settings",
          summary: "Change some of the widget settings",
          tags: ["Widget settings"],
        }),
      )
      .input(widgetSettingsPatchSchema)
      .output(widgetSettingsStateSchema),
    createAvatarUpload: avatarErrors
      .meta(
        openapi({
          method: "POST",
          path: "/widget-settings/avatar/uploads",
          summary: "Get a presigned URL to upload a new agent avatar",
          tags: ["Widget settings"],
        }),
      )
      .input(createAvatarUploadInputSchema)
      .output(avatarUploadSchema),
    confirmAvatarUpload: avatarErrors
      .meta(
        openapi({
          method: "PUT",
          path: "/widget-settings/avatar",
          summary: "Use an uploaded image as the agent avatar",
          tags: ["Widget settings"],
        }),
      )
      .input(confirmAvatarUploadInputSchema)
      .output(widgetSettingsStateSchema),
    removeAvatar: ownerOnly
      .meta(
        openapi({
          method: "DELETE",
          path: "/widget-settings/avatar",
          summary: "Remove the agent avatar",
          tags: ["Widget settings"],
        }),
      )
      .output(widgetSettingsStateSchema),
  },
  widget: {
    getConfig: widgetPublic
      .meta(
        openapi({
          method: "GET",
          path: "/widget/{workspaceId}/config",
          summary: "Get the public widget settings for an allowed website",
          tags: ["Widget"],
        }),
      )
      .input(widgetConfigInputSchema)
      .output(widgetConfigSchema),
    // Issues or refreshes the visitor token and records visitor details.
    start: widgetPublic
      .meta(
        openapi({
          method: "POST",
          path: "/widget/{workspaceId}/sessions",
          summary: "Start a widget session for a visitor",
          tags: ["Widget"],
        }),
      )
      .input(widgetStartInputSchema)
      .output(widgetSessionSchema),
    getThread: visitorOnly
      .meta(
        openapi({
          method: "GET",
          path: "/widget/thread",
          summary: "Get the visitor's conversation history",
          tags: ["Widget"],
        }),
      )
      .output(widgetThreadSchema),
    sendMessage: visitorOnly
      .meta(
        openapi({
          method: "POST",
          path: "/widget/messages",
          summary: "Send a message as the visitor",
          tags: ["Widget"],
        }),
      )
      .input(widgetSendMessageInputSchema)
      .output(widgetSendMessageOutputSchema),
    requestHuman: visitorOnly
      .errors({
        TRANSITION_NOT_ALLOWED: {
          message: "A person is already on the way.",
        },
      })
      .meta(
        openapi({
          method: "POST",
          path: "/widget/handoff",
          summary: "Ask for a person instead of the agent",
          tags: ["Widget"],
        }),
      )
      .output(widgetConversationSchema),
    // Opens the socket for the visitor's own conversation only. Null before the first message.
    getRealtimeToken: visitorOnly
      .meta(
        openapi({
          method: "POST",
          path: "/widget/realtime-token",
          summary:
            "Get a short-lived token for the conversation's live updates",
          tags: ["Widget"],
        }),
      )
      .input(widgetRealtimeTokenInputSchema)
      .output(widgetRealtimeTokenSchema),
  },
  realtime: {
    getToken: conversationErrors
      .meta(
        openapi({
          method: "POST",
          path: "/realtime/token",
          summary: "Get a short-lived token for live updates",
          tags: ["Real time"],
        }),
      )
      .input(ownerRealtimeTokenInputSchema)
      .output(realtimeTokenSchema),
  },
  inbox: {
    list: ownerOnly
      .meta(
        openapi({
          method: "GET",
          path: "/conversations",
          summary: "List the workspace's conversations, newest first",
          tags: ["Inbox"],
        }),
      )
      .output(z.array(conversationSchema)),
    get: conversationErrors
      .meta(
        openapi({
          method: "GET",
          path: "/conversations/{id}",
          summary: "Get a conversation with its full history",
          tags: ["Inbox"],
        }),
      )
      .input(conversationIdInputSchema)
      .output(conversationWithMessagesSchema),
    // Replying in ai or waiting takes the conversation over.
    reply: conversationErrors
      .meta(
        openapi({
          method: "POST",
          path: "/conversations/{id}/messages",
          summary: "Reply to the visitor",
          tags: ["Inbox"],
        }),
      )
      .input(inboxReplyInputSchema)
      .output(conversationChangeSchema),
    takeOver: conversationErrors
      .meta(
        openapi({
          method: "POST",
          path: "/conversations/{id}/take-over",
          summary: "Take the conversation over from the agent",
          tags: ["Inbox"],
        }),
      )
      .input(conversationIdInputSchema)
      .output(conversationChangeSchema),
    handBack: conversationErrors
      .meta(
        openapi({
          method: "POST",
          path: "/conversations/{id}/hand-back",
          summary: "Hand the conversation back to the agent",
          tags: ["Inbox"],
        }),
      )
      .input(conversationIdInputSchema)
      .output(conversationChangeSchema),
    close: conversationErrors
      .meta(
        openapi({
          method: "POST",
          path: "/conversations/{id}/close",
          summary: "Close the conversation",
          tags: ["Inbox"],
        }),
      )
      .input(conversationIdInputSchema)
      .output(conversationChangeSchema),
    markRead: conversationErrors
      .meta(
        openapi({
          method: "POST",
          path: "/conversations/{id}/read",
          summary: "Mark the conversation as read",
          tags: ["Inbox"],
        }),
      )
      .input(conversationIdInputSchema)
      .output(conversationSchema),
  },
};

export type Contract = typeof contract;
