import "server-only";
import {
  AGENT_OFF_NOTICE,
  CLOSED_NOTICE,
  contract,
  HAND_BACK_NOTICE,
} from "@marshaldesk/shared";
import {
  closeConversation,
  createWorkspaceForOwner,
  findLatestConversation,
  findVisitor,
  findWorkspaceForUser,
  getConversation,
  getWidgetAccess,
  getWidgetSettings,
  handBackConversation,
  listConversations,
  listMessages,
  listVisitorMessages,
  markConversationRead,
  requestHuman,
  saveMemberReply,
  saveVisitorMessage,
  takeOverConversation,
  type TransitionResult,
  replaceAgentAvatarKey,
  updateWidgetSettings,
  type WidgetSettingsRow,
} from "@marshaldesk/db";
import { implement, ORPCError, os as base } from "@orpc/server";
import { getSessionUser } from "@/lib/auth/server";
import { PROFILE_IMAGES_BUCKET, deleteObjectQuietly } from "@/lib/storage/s3";
import {
  createAvatarUpload,
  isOwnAvatarKey,
  verifyUploadedAvatar,
} from "@/lib/widget-settings/avatar";
import { toWidgetSettingsState } from "@/lib/widget-settings/state";
import {
  toConversation,
  toMessage,
  toWidgetConversation,
  toWidgetMessage,
} from "@/lib/conversations/mappers";
import { isHostAllowed } from "@/lib/visitor/development-hosts";
import {
  isAgentOn,
  startWidgetSession,
  toWidgetConfig,
  widgetAccess,
} from "@/lib/visitor/session";
import {
  bearerToken,
  verifyVisitorToken,
  visitorSecretMatches,
} from "@/lib/visitor/tokens";

export type BaseContext = { headers: Headers };

const os = implement(contract).$context<BaseContext>();

// Built on the base builder with its own error map, so it applies to any contract namespace
// whose procedures declare these errors (see `ownerOnly` in the contract).
const verifiedUserMiddleware = (fresh: boolean) =>
  base
    .$context<BaseContext>()
    .errors({ UNAUTHORIZED: {}, EMAIL_NOT_VERIFIED: {} })
    .middleware(async ({ context, next, errors }) => {
      const user = await getSessionUser(context.headers, { fresh });
      if (!user) throw errors.UNAUTHORIZED();
      if (!user.emailVerified) throw errors.EMAIL_NOT_VERIFIED();
      return next({ context: { user } });
    });

// ownerProcedure: verifies the session and adds the caller's workspace. workspaceId only ever
// comes from here, never from input.
const requireOwner = base
  .$context<BaseContext>()
  .errors({ UNAUTHORIZED: {}, EMAIL_NOT_VERIFIED: {}, WORKSPACE_REQUIRED: {} })
  .use(verifiedUserMiddleware(false))
  .middleware(async ({ context, next, errors }) => {
    const workspace = await findWorkspaceForUser(context.user.id);
    if (!workspace) throw errors.WORKSPACE_REQUIRED();
    return next({ context: { workspace, workspaceId: workspace.id } });
  });

// visitorProcedure: the visitor token must verify, match the stored secret hash, and still be for
// an allowed domain, so removing a domain cuts off tokens already issued for it.
const requireVisitor = base
  .$context<BaseContext>()
  .errors({ VISITOR_UNAUTHORIZED: {} })
  .middleware(async ({ context, next, errors }) => {
    const token = bearerToken(context.headers);
    const claims = token ? await verifyVisitorToken(token) : null;
    if (!claims) throw errors.VISITOR_UNAUTHORIZED();
    const [visitor, access] = await Promise.all([
      findVisitor(claims.wid, claims.sub),
      getWidgetAccess(claims.wid),
    ]);
    if (
      !visitor ||
      !access ||
      !visitorSecretMatches(claims.vsk, visitor.vskHash) ||
      !isHostAllowed(access.allowedDomains, claims.host)
    ) {
      throw errors.VISITOR_UNAUTHORIZED();
    }
    return next({
      context: { visitor, workspaceId: claims.wid, host: claims.host },
    });
  });

const owner = os.owner.use(requireOwner);
const inbox = os.inbox.use(requireOwner);
const widgetVisitor = os.widget.use(requireVisitor);
const widgetSettings = os.widgetSettings.use(requireOwner);
const signedInWorkspace = os.workspace.use(verifiedUserMiddleware(true));

type ConversationErrors = {
  CONVERSATION_NOT_FOUND: () => Error;
  TRANSITION_NOT_ALLOWED: () => Error;
};

function transitionOutput(
  result: TransitionResult,
  errors: ConversationErrors,
) {
  if (!result.ok) {
    switch (result.reason) {
      case "not_found":
        throw errors.CONVERSATION_NOT_FOUND();
      case "not_allowed":
        throw errors.TRANSITION_NOT_ALLOWED();
      default: {
        const unreachable: never = result.reason;
        return unreachable;
      }
    }
  }
  return {
    conversation: toConversation(result.conversation),
    message: result.message ? toMessage(result.message) : null,
  };
}

function requireRow(row: WidgetSettingsRow | null): WidgetSettingsRow {
  // The workspace was found by the middleware moments ago; losing it means it was deleted.
  if (!row) throw new ORPCError("NOT_FOUND");
  return row;
}

export const router = os.router({
  health: {
    ping: os.health.ping.handler(() => ({
      status: "ok" as const,
      time: new Date().toISOString(),
    })),
  },
  owner: {
    getCurrent: owner.getCurrent.handler(({ context }) => ({
      user: {
        id: context.user.id,
        name: context.user.name,
        email: context.user.email,
        image: context.user.image,
      },
      workspace: context.workspace,
    })),
  },
  workspace: {
    create: signedInWorkspace.create.handler(async ({ input, context }) => {
      const { workspace } = await createWorkspaceForOwner({
        userId: context.user.id,
        name: input.name,
      });
      return workspace;
    }),
  },
  widgetSettings: {
    get: widgetSettings.get.handler(async ({ context }) =>
      toWidgetSettingsState(
        requireRow(await getWidgetSettings(context.workspaceId)),
      ),
    ),
    update: widgetSettings.update.handler(async ({ input, context }) =>
      toWidgetSettingsState(
        requireRow(await updateWidgetSettings(context.workspaceId, input)),
      ),
    ),
    createAvatarUpload: widgetSettings.createAvatarUpload.handler(
      ({ input, context }) =>
        createAvatarUpload(context.workspaceId, input.contentType),
    ),
    confirmAvatarUpload: widgetSettings.confirmAvatarUpload.handler(
      async ({ input, context, errors }) => {
        if (!isOwnAvatarKey(context.workspaceId, input.key)) {
          throw errors.AVATAR_INVALID({
            message: "This upload doesn't belong to your workspace.",
          });
        }
        const verdict = await verifyUploadedAvatar(input.key);
        switch (verdict) {
          case "missing":
            throw errors.AVATAR_INVALID({
              message: "The upload didn't finish. Try again.",
            });
          case "invalid":
            throw errors.AVATAR_INVALID();
          case "ok":
            break;
          default: {
            const unreachable: never = verdict;
            return unreachable;
          }
        }
        const result = await replaceAgentAvatarKey(
          context.workspaceId,
          input.key,
        );
        if (!result) throw new ORPCError("NOT_FOUND");
        if (result.previousKey && result.previousKey !== input.key) {
          await deleteObjectQuietly(PROFILE_IMAGES_BUCKET, result.previousKey);
        }
        return toWidgetSettingsState(result.row);
      },
    ),
    removeAvatar: widgetSettings.removeAvatar.handler(async ({ context }) => {
      const result = await replaceAgentAvatarKey(context.workspaceId, null);
      if (!result) throw new ORPCError("NOT_FOUND");
      if (result.previousKey) {
        await deleteObjectQuietly(PROFILE_IMAGES_BUCKET, result.previousKey);
      }
      return toWidgetSettingsState(result.row);
    }),
  },
  widget: {
    getConfig: os.widget.getConfig.handler(async ({ input, errors }) => {
      const access = await widgetAccess(input.workspaceId, input.host);
      switch (access.status) {
        case "not_found":
          throw errors.WIDGET_NOT_FOUND();
        case "not_allowed":
          throw errors.DOMAIN_NOT_ALLOWED();
        case "ok":
          return toWidgetConfig(access.row);
        default: {
          const unreachable: never = access;
          return unreachable;
        }
      }
    }),
    start: os.widget.start.handler(async ({ input, context, errors }) => {
      const access = await widgetAccess(input.workspaceId, input.host);
      switch (access.status) {
        case "not_found":
          throw errors.WIDGET_NOT_FOUND();
        case "not_allowed":
          throw errors.DOMAIN_NOT_ALLOWED();
        case "ok":
          return startWidgetSession(access.row, input, context.headers);
        default: {
          const unreachable: never = access;
          return unreachable;
        }
      }
    }),
    getThread: widgetVisitor.getThread.handler(async ({ context }) => {
      const [conversation, messages] = await Promise.all([
        findLatestConversation(context.workspaceId, context.visitor.id),
        listVisitorMessages(context.workspaceId, context.visitor.id),
      ]);
      return {
        conversation: conversation ? toWidgetConversation(conversation) : null,
        messages: messages.map(toWidgetMessage),
      };
    }),
    sendMessage: widgetVisitor.sendMessage.handler(
      async ({ input, context }) => {
        const settings = requireRow(
          await getWidgetSettings(context.workspaceId),
        );
        const result = await saveVisitorMessage({
          workspaceId: context.workspaceId,
          visitorId: context.visitor.id,
          body: input.body,
          greeting: settings.greeting,
          agentOn: isAgentOn(settings),
          agentOffNotice: AGENT_OFF_NOTICE,
        });
        // The agent pipeline (next chapter) starts here, after the save, without blocking.
        return {
          conversation: toWidgetConversation(result.conversation),
          messages: result.messages.map(toWidgetMessage),
        };
      },
    ),
    requestHuman: widgetVisitor.requestHuman.handler(
      async ({ context, errors }) => {
        const conversation = await requestHuman(
          context.workspaceId,
          context.visitor.id,
        );
        if (!conversation) throw errors.TRANSITION_NOT_ALLOWED();
        return toWidgetConversation(conversation);
      },
    ),
  },
  inbox: {
    list: inbox.list.handler(async ({ context }) =>
      (await listConversations(context.workspaceId)).map(toConversation),
    ),
    get: inbox.get.handler(async ({ input, context, errors }) => {
      const [conversation, messages] = await Promise.all([
        getConversation(context.workspaceId, input.id),
        listMessages(context.workspaceId, input.id),
      ]);
      if (!conversation) throw errors.CONVERSATION_NOT_FOUND();
      return {
        conversation: toConversation(conversation),
        messages: messages.map(toMessage),
      };
    }),
    reply: inbox.reply.handler(async ({ input, context, errors }) =>
      transitionOutput(
        await saveMemberReply({
          workspaceId: context.workspaceId,
          conversationId: input.id,
          member: {
            id: context.user.id,
            name: context.user.name,
            imageUrl: context.user.image,
          },
          body: input.body,
        }),
        errors,
      ),
    ),
    takeOver: inbox.takeOver.handler(async ({ input, context, errors }) =>
      transitionOutput(
        await takeOverConversation(context.workspaceId, input.id),
        errors,
      ),
    ),
    handBack: inbox.handBack.handler(async ({ input, context, errors }) =>
      transitionOutput(
        await handBackConversation(
          context.workspaceId,
          input.id,
          HAND_BACK_NOTICE,
        ),
        errors,
      ),
    ),
    close: inbox.close.handler(async ({ input, context, errors }) =>
      transitionOutput(
        await closeConversation(context.workspaceId, input.id, CLOSED_NOTICE),
        errors,
      ),
    ),
    markRead: inbox.markRead.handler(async ({ input, context, errors }) => {
      const conversation = await markConversationRead(
        context.workspaceId,
        input.id,
      );
      if (!conversation) throw errors.CONVERSATION_NOT_FOUND();
      return toConversation(conversation);
    }),
  },
});

export type Router = typeof router;
