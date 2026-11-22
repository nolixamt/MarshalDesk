import "server-only";
import {
  REALTIME_TOKEN_AUDIENCE,
  type RealtimeTokenClaims,
} from "@marshaldesk/shared";
import { SignJWT } from "jose";
import { realtimeEnv } from "@/lib/realtime/env";

const key = new TextEncoder().encode(realtimeEnv.REALTIME_TOKEN_SECRET);

/** Only opens a socket: the Worker checks it once in onBeforeConnect. */
export async function issueRealtimeToken(
  claims: RealtimeTokenClaims,
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(REALTIME_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(key);
}
