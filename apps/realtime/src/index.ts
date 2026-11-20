import {
  clientRoomMessageSchema,
  conversationRoomEventSchema,
  REALTIME_TOKEN_AUDIENCE,
  realtimeTokenClaimsSchema,
  workspaceRoomEventSchema,
  type ConversationRoomEvent,
  type RealtimeParty,
  type RealtimeRole,
} from "@marshaldesk/shared/realtime";
import { errors, jwtVerify } from "jose";
import {
  routePartykitRequest,
  Server,
  type Connection,
  type ConnectionContext,
  type Lobby,
} from "partyserver";
import type * as z from "zod";

type Env = Cloudflare.Env;

// Set here from the verified token; anything a client sends under these names is dropped first.
const ROLE_HEADER = "x-marshaldesk-role";
const WORKSPACE_HEADER = "x-marshaldesk-workspace";
const TRUSTED_HEADER_PREFIX = "x-marshaldesk-";

// Stored in the hibernation-safe socket attachment (2 KB limit), never in class fields.
type ConnectionState = { role: RealtimeRole; workspaceId: string };

function partyOf(lobby: Lobby): RealtimeParty | null {
  switch (lobby.className) {
    case "Conversation":
      return "conversation";
    case "Workspace":
      return "workspace";
    default:
      return null;
  }
}

async function verifySocketToken(
  request: Request,
  lobby: Lobby,
  env: Env,
): Promise<Response | Request> {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return new Response("Unauthorized", { status: 401 });

  let payload: unknown;
  try {
    ({ payload } = await jwtVerify(
      token,
      new TextEncoder().encode(env.REALTIME_TOKEN_SECRET),
      { audience: REALTIME_TOKEN_AUDIENCE, algorithms: ["HS256"] },
    ));
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      return new Response("Unauthorized", { status: 401 });
    }
    throw error;
  }
  const claims = realtimeTokenClaimsSchema.safeParse(payload);
  if (!claims.success) return new Response("Unauthorized", { status: 401 });

  const { party, room, role, wid } = claims.data;
  const allowed =
    party === partyOf(lobby) &&
    room === lobby.name &&
    // The workspace room is the owner's alone.
    (party === "conversation" || role === "owner");
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const headers = new Headers(request.headers);
  for (const name of [...headers.keys()]) {
    if (name.toLowerCase().startsWith(TRUSTED_HEADER_PREFIX)) {
      headers.delete(name);
    }
  }
  headers.set(ROLE_HEADER, role);
  headers.set(WORKSPACE_HEADER, wid);
  return new Request(request, { headers });
}

async function sha256(value: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
}

async function isPublisher(request: Request, env: Env): Promise<boolean> {
  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  // Equal-length digests, so the comparison itself can't throw or leak the length.
  const [a, b] = await Promise.all([
    sha256(given),
    sha256(env.REALTIME_PUBLISH_SECRET),
  ]);
  return given.length > 0 && crypto.subtle.timingSafeEqual(a, b);
}

function stateFromHeaders(headers: Headers): ConnectionState | null {
  const role = headers.get(ROLE_HEADER);
  const workspaceId = headers.get(WORKSPACE_HEADER);
  if ((role !== "visitor" && role !== "owner") || !workspaceId) return null;
  return { role, workspaceId };
}

function readState(connection: Connection): ConnectionState | null {
  const state: unknown = connection.state;
  if (typeof state !== "object" || state === null) return null;
  if (!("role" in state) || !("workspaceId" in state)) return null;
  const { role, workspaceId } = state;
  if (
    (role !== "visitor" && role !== "owner") ||
    typeof workspaceId !== "string"
  ) {
    return null;
  }
  return { role, workspaceId };
}

/** Next.js publishes one event per POST, after the change is saved in Postgres. */
async function handlePublish<T>(
  request: Request,
  env: Env,
  schema: z.ZodType<T>,
  broadcast: (event: T) => void,
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { allow: "POST" },
    });
  }
  if (!(await isPublisher(request, env))) {
    return new Response("Unauthorized", { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const event = schema.safeParse(body);
  if (!event.success) return new Response("Invalid event", { status: 400 });
  broadcast(event.data);
  return new Response(null, { status: 204 });
}

class RoomServer extends Server<Env> {
  static options = { hibernate: true };

  onConnect(connection: Connection, ctx: ConnectionContext) {
    const state = stateFromHeaders(ctx.request.headers);
    if (!state) {
      connection.close(1008, "Unauthorized");
      return;
    }
    connection.setState(state);
  }
}

export class Conversation extends RoomServer {
  onMessage(connection: Connection, message: string | ArrayBuffer) {
    const state = readState(connection);
    if (!state || typeof message !== "string") return;
    let data: unknown;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }
    const parsed = clientRoomMessageSchema.safeParse(data);
    if (!parsed.success) return;
    // The author comes from the verified token, never from the message.
    const event: ConversationRoomEvent = {
      type: "typing",
      author: state.role === "owner" ? "member" : "visitor",
      typing: parsed.data.typing,
    };
    this.broadcast(JSON.stringify(event), [connection.id]);
  }

  onRequest(request: Request) {
    return handlePublish(
      request,
      this.env,
      conversationRoomEventSchema,
      (event) => this.broadcast(JSON.stringify(event)),
    );
  }
}

export class Workspace extends RoomServer {
  // Owners only listen here; nothing a client sends is relayed.
  onMessage() {}

  onRequest(request: Request) {
    return handlePublish(request, this.env, workspaceRoomEventSchema, (event) =>
      this.broadcast(JSON.stringify(event)),
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await routePartykitRequest(request, env, {
      onBeforeConnect: (req, lobby) => verifySocketToken(req, lobby, env),
    });
    return response ?? new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
