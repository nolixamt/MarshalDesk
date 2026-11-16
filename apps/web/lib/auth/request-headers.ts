import { cookies, headers } from "next/headers";

// When proxy.ts refreshes the session cookie, Next exposes the new value
// through cookies() but not through the raw cookie header, so rebuild it.
export async function requestHeaders(): Promise<Headers> {
  const [incoming, cookieStore] = await Promise.all([headers(), cookies()]);
  const merged = new Headers(incoming);
  merged.set("cookie", cookieStore.toString());
  return merged;
}
