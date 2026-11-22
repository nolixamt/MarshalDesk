import "server-only";
import type {
  ConversationRoomEvent,
  RealtimeParty,
  WorkspaceRoomEvent,
} from "@marshaldesk/shared";
import { realtimeEnv } from "@/lib/realtime/env";

const PUBLISH_TIMEOUT_MS = 2_000;

// Called only after the change is committed to Postgres. Delivery is best effort: a failure is
// logged and never fails the write, because clients rebuild from the API when they reconnect.
async function publish(party: RealtimeParty, room: string, event: unknown) {
  const url = new URL(
    `/parties/${party}/${encodeURIComponent(room)}`,
    realtimeEnv.REALTIME_URL,
  );
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${realtimeEnv.REALTIME_PUBLISH_SECRET}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(PUBLISH_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error(
        `Real-time publish to ${party}/${room} failed with ${response.status}`,
      );
    }
  } catch (error) {
    console.error(`Real-time publish to ${party}/${room} failed`, error);
  }
}

export function publishToConversation(
  conversationId: string,
  events: ConversationRoomEvent[],
): Promise<void> {
  return publishInOrder("conversation", conversationId, events);
}

export function publishToWorkspace(
  workspaceId: string,
  events: WorkspaceRoomEvent[],
): Promise<void> {
  return publishInOrder("workspace", workspaceId, events);
}

async function publishInOrder(
  party: RealtimeParty,
  room: string,
  events: unknown[],
) {
  for (const event of events) {
    await publish(party, room, event);
  }
}
