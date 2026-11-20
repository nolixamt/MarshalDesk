import "server-only";
import type { WidgetSettingsRow } from "@marshaldesk/db";
import {
  defaultAgentName,
  type WidgetSettingsState,
} from "@marshaldesk/shared";
import { PROFILE_IMAGES_BUCKET, publicObjectUrl } from "@/lib/storage/s3";

export function agentAvatarPublicUrl(key: string | null): string | null {
  return key ? publicObjectUrl(PROFILE_IMAGES_BUCKET, key) : null;
}

export function resolvedAgentName(row: WidgetSettingsRow): string {
  return row.agentName ?? defaultAgentName(row.workspaceName);
}

export function toWidgetSettingsState(
  row: WidgetSettingsRow,
): WidgetSettingsState {
  return {
    workspaceId: row.workspaceId,
    settings: {
      position: row.position,
      color: row.color,
      agentName: resolvedAgentName(row),
      agentAvatarUrl: agentAvatarPublicUrl(row.agentAvatarKey),
      greeting: row.greeting,
      allowedDomains: [...row.allowedDomains],
    },
    setupProgress: {
      // Sources arrive with the knowledge base; until then nothing is ready.
      hasReadySource: false,
      hasAllowedDomain: row.allowedDomains.length > 0,
      snippetInstalled: row.snippetInstalledAt !== null,
    },
  };
}
