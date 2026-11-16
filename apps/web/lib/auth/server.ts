import "server-only";
import { createNeonAuth } from "@neon/auth/next/server";
import { createAuthServer, extractNeonAuthCookies } from "@neon/auth/server";
import { serverEnv } from "@/lib/env";

export const auth = createNeonAuth({
  baseUrl: serverEnv.NEON_AUTH_BASE_URL,
  cookies: { secret: serverEnv.NEON_AUTH_COOKIE_SECRET },
});

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
};

// Reads the session from request headers only. The default Next.js context
// writes refreshed cookies through next/headers, which throws while a server
// component renders, so cookie refresh is left to proxy.ts and /api/auth.
export async function getSessionUser(
  headers: Headers,
  { fresh = false }: { fresh?: boolean } = {},
): Promise<SessionUser | null> {
  const server = createAuthServer({
    baseUrl: serverEnv.NEON_AUTH_BASE_URL,
    cookieSecret: serverEnv.NEON_AUTH_COOKIE_SECRET,
    context: () => ({
      getCookies: () => extractNeonAuthCookies(headers),
      setCookie: () => {},
      getHeader: (name) => headers.get(name),
      getOrigin: () => headers.get("origin") ?? serverEnv.NEXT_PUBLIC_APP_URL,
      getFramework: () => "nextjs",
    }),
  });

  // fresh skips the 5-minute signed session cookie cache, so a session revoked
  // elsewhere can't be replayed for writes.
  const { data, error } = await server.getSession(
    fresh ? { query: { disableCookieCache: "true" } } : undefined,
  );
  if (error || !data?.user) return null;

  const { user } = data;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image ?? null,
  };
}
