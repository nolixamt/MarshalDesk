import { db } from "./prisma/db";

export type AccentColorValue =
  "blue" | "indigo" | "violet" | "pink" | "red" | "orange" | "green";
export type WidgetPositionValue = "bottom-right" | "bottom-left";

export type WidgetSettingsRow = {
  workspaceId: string;
  workspaceName: string;
  position: WidgetPositionValue;
  color: AccentColorValue;
  agentName: string | null;
  agentAvatarKey: string | null;
  greeting: string;
  allowedDomains: readonly string[];
  snippetInstalledAt: Date | null;
};

export type WidgetSettingsUpdate = {
  position?: WidgetPositionValue;
  color?: AccentColorValue;
  agentName?: string;
  greeting?: string;
  allowedDomains?: string[];
};

const columns = [
  "id",
  "name",
  "position",
  "color",
  "agentName",
  "agentAvatarKey",
  "greeting",
  "allowedDomains",
  "snippetInstalledAt",
] as const;

type SelectedRow = {
  id: string;
  name: string;
  position: WidgetPositionValue;
  color: AccentColorValue;
  agentName: string | null;
  agentAvatarKey: string | null;
  greeting: string;
  allowedDomains: readonly string[];
  snippetInstalledAt: Date | null;
};

function toRow(row: SelectedRow): WidgetSettingsRow {
  return {
    workspaceId: row.id,
    workspaceName: row.name,
    position: row.position,
    color: row.color,
    agentName: row.agentName,
    agentAvatarKey: row.agentAvatarKey,
    greeting: row.greeting,
    allowedDomains: row.allowedDomains,
    snippetInstalledAt: row.snippetInstalledAt,
  };
}

export async function getWidgetSettings(
  workspaceId: string,
): Promise<WidgetSettingsRow | null> {
  const row = await db.orm.public.Workspace.where({ id: workspaceId })
    .select(...columns)
    .first();
  return row ? toRow(row) : null;
}

export async function updateWidgetSettings(
  workspaceId: string,
  update: WidgetSettingsUpdate,
): Promise<WidgetSettingsRow | null> {
  if (Object.keys(update).length === 0) {
    return getWidgetSettings(workspaceId);
  }
  const row = await db.orm.public.Workspace.where({ id: workspaceId })
    .select(...columns)
    .update(update);
  return row ? toRow(row) : null;
}

/** Sets the avatar key and returns the key it replaced, so the caller can delete that object. */
export async function replaceAgentAvatarKey(
  workspaceId: string,
  key: string | null,
): Promise<{ row: WidgetSettingsRow; previousKey: string | null } | null> {
  return db.transaction(async (tx) => {
    const current = await tx.orm.public.Workspace.where({ id: workspaceId })
      .select("agentAvatarKey")
      .forUpdate()
      .first();
    if (!current) return null;
    const row = await tx.orm.public.Workspace.where({ id: workspaceId })
      .select(...columns)
      .update({ agentAvatarKey: key });
    if (!row) return null;
    return { row: toRow(row), previousKey: current.agentAvatarKey };
  });
}
