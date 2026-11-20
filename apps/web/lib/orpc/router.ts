import "server-only";
import { contract } from "@marshaldesk/shared";
import {
  createWorkspaceForOwner,
  findWorkspaceForUser,
  getWidgetSettings,
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

const owner = os.owner.use(requireOwner);
const widgetSettings = os.widgetSettings.use(requireOwner);
const signedInWorkspace = os.workspace.use(verifiedUserMiddleware(true));

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
});

export type Router = typeof router;
