import "server-only";
import {
  createVisitor,
  findVisitor,
  getWidgetSettings,
  markSnippetInstalled,
  touchVisitor,
  type WidgetSettingsRow,
} from "@marshaldesk/db";
import type {
  WidgetConfig,
  WidgetSession,
  WidgetStartInput,
} from "@marshaldesk/shared";
import {
  isDevelopmentHost,
  isHostAllowed,
} from "@/lib/visitor/development-hosts";
import { visitorDetailsFrom } from "@/lib/visitor/details";
import {
  hashVisitorSecret,
  issueVisitorToken,
  newVisitorSecret,
  verifyVisitorToken,
  visitorSecretMatches,
  VISITOR_TOKEN_REFRESH_AFTER_SECONDS,
} from "@/lib/visitor/tokens";
import {
  agentAvatarPublicUrl,
  resolvedAgentName,
} from "@/lib/widget-settings/state";

// The knowledge base arrives next chapter; until then every workspace runs with the agent off.
export function isAgentOn(): boolean {
  return false;
}

export function toWidgetConfig(row: WidgetSettingsRow): WidgetConfig {
  const agentOn = isAgentOn();
  return {
    workspaceId: row.workspaceId,
    agentName: resolvedAgentName(row),
    agentAvatarUrl: agentAvatarPublicUrl(row.agentAvatarKey),
    color: row.color,
    position: row.position,
    greeting: row.greeting,
    agentOn,
    suggestedQuestions: [],
  };
}

export type WidgetAccess =
  | { status: "ok"; row: WidgetSettingsRow }
  | { status: "not_found" }
  | { status: "not_allowed" };

export async function widgetAccess(
  workspaceId: string,
  host: string,
): Promise<WidgetAccess> {
  const row = await getWidgetSettings(workspaceId);
  if (!row) return { status: "not_found" };
  if (!isHostAllowed(row.allowedDomains, host))
    return { status: "not_allowed" };
  return { status: "ok", row };
}

/** Reuses the visitor behind a valid token for this workspace, or starts a new visitor. */
export async function startWidgetSession(
  row: WidgetSettingsRow,
  input: WidgetStartInput,
  headers: Headers,
): Promise<WidgetSession> {
  const details = visitorDetailsFrom(headers, input.details);
  const claims = input.token ? await verifyVisitorToken(input.token) : null;
  const existing =
    claims && claims.wid === row.workspaceId
      ? await findVisitor(row.workspaceId, claims.sub)
      : null;

  let session: { visitorId: string; token: string };
  if (
    claims &&
    existing &&
    visitorSecretMatches(claims.vsk, existing.vskHash)
  ) {
    await touchVisitor(row.workspaceId, existing.id, details);
    const age = Math.floor(Date.now() / 1000) - claims.iat;
    const token =
      age > VISITOR_TOKEN_REFRESH_AFTER_SECONDS || claims.host !== input.host
        ? await issueVisitorToken({
            visitorId: existing.id,
            workspaceId: row.workspaceId,
            host: input.host,
            vsk: claims.vsk,
          })
        : (input.token ?? "");
    session = { visitorId: existing.id, token };
  } else {
    const vsk = newVisitorSecret();
    const visitor = await createVisitor(row.workspaceId, {
      vskHash: hashVisitorSecret(vsk),
      details,
    });
    session = {
      visitorId: visitor.id,
      token: await issueVisitorToken({
        visitorId: visitor.id,
        workspaceId: row.workspaceId,
        host: input.host,
        vsk,
      }),
    };
  }

  if (!isDevelopmentHost(input.host) && row.snippetInstalledAt === null) {
    await markSnippetInstalled(row.workspaceId);
  }
  return { ...session, config: toWidgetConfig(row) };
}
