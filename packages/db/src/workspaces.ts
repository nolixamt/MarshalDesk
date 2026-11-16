import {
  SqlQueryError,
  isUniqueConstraintViolation,
} from "@prisma/orm-family-sql/errors";
import { db } from "./prisma/db";

export type WorkspaceSummary = { id: string; name: string };

const MEMBERS_USER_ID_UNIQUE = "members_user_id_key";

function isMemberUserIdConflict(error: unknown): boolean {
  for (
    let current: unknown = error;
    current instanceof Error;
    current = current.cause
  ) {
    if (SqlQueryError.is(current) && isUniqueConstraintViolation(current)) {
      return (
        current.constraint === undefined ||
        current.constraint === MEMBERS_USER_ID_UNIQUE
      );
    }
  }
  return false;
}

/**
 * Bootstrap lookup by the Neon Auth user id. This is the one documented exception to "every
 * workspace data function takes workspaceId": it is how ownerProcedure finds the caller's workspace.
 */
export async function findWorkspaceForUser(
  userId: string,
): Promise<WorkspaceSummary | null> {
  const member = await db.orm.public.Member.where({ userId })
    .select("id")
    .include("workspace", (workspace) => workspace.select("id", "name"))
    .first();
  return member?.workspace ?? null;
}

/**
 * Creates the workspace and its owner member in one transaction. Idempotent per user: if the user
 * already has a membership (including when a concurrent call wins the unique members.user_id race),
 * it returns the existing workspace with created: false and does not rename it.
 * Keyed by userId: together with findWorkspaceForUser this is the bootstrap exception to
 * "workspace data functions take workspaceId".
 */
export async function createWorkspaceForOwner(input: {
  userId: string;
  name: string;
}): Promise<{ workspace: WorkspaceSummary; created: boolean }> {
  const existing = await findWorkspaceForUser(input.userId);
  if (existing) {
    return { workspace: existing, created: false };
  }

  try {
    const workspace = await db.transaction(async (tx) => {
      const created = await tx.orm.public.Workspace.create({
        name: input.name,
      });
      await tx.orm.public.Member.create({
        workspaceId: created.id,
        userId: input.userId,
        role: "owner",
      });
      return { id: created.id, name: created.name };
    });
    return { workspace, created: true };
  } catch (error) {
    if (!isMemberUserIdConflict(error)) {
      throw error;
    }
    const winner = await findWorkspaceForUser(input.userId);
    if (!winner) {
      throw error;
    }
    return { workspace: winner, created: false };
  }
}

export async function getWorkspace(
  workspaceId: string,
): Promise<WorkspaceSummary | null> {
  const workspace = await db.orm.public.Workspace.where({ id: workspaceId })
    .select("id", "name")
    .first();
  return workspace ?? null;
}
