import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { errors, jwtVerify, SignJWT } from "jose";
import * as z from "zod";
import { visitorEnv } from "@/lib/visitor/env";

const AUDIENCE = "widget";
const LIFETIME = "30d";
// widget.start re-issues tokens older than this, so active visitors never hit the 30-day expiry.
export const VISITOR_TOKEN_REFRESH_AFTER_SECONDS = 24 * 60 * 60;

const key = new TextEncoder().encode(visitorEnv.VISITOR_TOKEN_SECRET);

const claimsSchema = z.object({
  sub: z.uuid(),
  wid: z.uuid(),
  host: z.string().min(1),
  vsk: z.string().min(16),
  iat: z.number(),
});
export type VisitorTokenClaims = z.infer<typeof claimsSchema>;

export function newVisitorSecret(): string {
  return randomBytes(32).toString("base64url");
}

export function hashVisitorSecret(vsk: string): string {
  return createHash("sha256").update(vsk).digest("hex");
}

export function visitorSecretMatches(vsk: string, storedHash: string): boolean {
  const given = Buffer.from(hashVisitorSecret(vsk), "hex");
  const stored = Buffer.from(storedHash, "hex");
  return given.length === stored.length && timingSafeEqual(given, stored);
}

export async function issueVisitorToken(claims: {
  visitorId: string;
  workspaceId: string;
  host: string;
  vsk: string;
}): Promise<string> {
  return new SignJWT({
    wid: claims.workspaceId,
    host: claims.host,
    vsk: claims.vsk,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.visitorId)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(LIFETIME)
    .sign(key);
}

/** Null for anything that isn't a valid, unexpired visitor token. */
export async function verifyVisitorToken(
  token: string,
): Promise<VisitorTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    const parsed = claimsSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch (error) {
    if (error instanceof errors.JOSEError) return null;
    throw error;
  }
}

export function bearerToken(headers: Headers): string | null {
  const value = headers.get("authorization");
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}
