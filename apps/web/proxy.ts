import { getWidgetAccess } from "@marshaldesk/db";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";
import { frameAncestorSources } from "@/lib/visitor/development-hosts";

// Optimistic gate only: it also exchanges the OAuth and magic-link session
// verifier. Viewer routing and ownerProcedure do the real checks.
const dashboardGate = auth.middleware({ loginUrl: "/auth/sign-in" });

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Browsers refuse to render the widget iframe anywhere but the workspace's allowed domains.
async function frameAncestors(workspaceId: string | undefined) {
  if (!workspaceId || !uuidPattern.test(workspaceId)) return "'none'";
  const access = await getWidgetAccess(workspaceId);
  const sources = frameAncestorSources(access?.allowedDomains ?? []);
  return access && sources.length > 0 ? sources.join(" ") : "'none'";
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/widget/")) {
    const workspaceId = pathname.split("/")[2];
    const response = NextResponse.next();
    response.headers.set(
      "Content-Security-Policy",
      `frame-ancestors ${await frameAncestors(workspaceId)}`,
    );
    return response;
  }
  const response = await dashboardGate(request);
  // The dashboard is never meant to be framed.
  response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/widget/:path*"],
};
