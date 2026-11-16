import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";
import * as z from "zod";
import { workspaceNameSchema } from "./auth";

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
};

export type Contract = typeof contract;
