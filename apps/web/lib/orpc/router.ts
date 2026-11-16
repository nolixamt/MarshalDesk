import "server-only";
import { contract } from "@marshaldesk/shared";
import { createWorkspaceForOwner, findWorkspaceForUser } from "@marshaldesk/db";
import { implement } from "@orpc/server";
import { getSessionUser } from "@/lib/auth/server";

export type BaseContext = { headers: Headers };

const os = implement(contract).$context<BaseContext>();

// Built from sub-routers whose procedures all declare the errors they throw;
// the root map is a union that includes health, which declares none.
const verifiedUserMiddleware = (fresh: boolean) =>
  os.workspace.middleware(async ({ context, next, errors }) => {
    const user = await getSessionUser(context.headers, { fresh });
    if (!user) throw errors.UNAUTHORIZED();
    if (!user.emailVerified) throw errors.EMAIL_NOT_VERIFIED();
    return next({ context: { user } });
  });

const requireVerifiedUser = verifiedUserMiddleware(false);

const verifiedOwner = os.owner.use(requireVerifiedUser);

const requireWorkspace = verifiedOwner.middleware(
  async ({ context, next, errors }) => {
    const workspace = await findWorkspaceForUser(context.user.id);
    if (!workspace) throw errors.WORKSPACE_REQUIRED();
    return next({ context: { workspace, workspaceId: workspace.id } });
  },
);

// ownerProcedure: every owner procedure except workspace.create.
const ownerProcedure = verifiedOwner.use(requireWorkspace);
const signedInWorkspace = os.workspace.use(verifiedUserMiddleware(true));

export const router = os.router({
  health: {
    ping: os.health.ping.handler(() => ({
      status: "ok" as const,
      time: new Date().toISOString(),
    })),
  },
  owner: {
    getCurrent: ownerProcedure.getCurrent.handler(({ context }) => ({
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
});

export type Router = typeof router;
