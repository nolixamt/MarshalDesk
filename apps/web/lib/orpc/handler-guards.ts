import { ORPCError } from "@orpc/server";

// Browsers always send Origin on cross-site POSTs; requests without one (curl,
// server-to-server) carry no ambient cookies worth protecting.
export function rejectCrossOrigin(request: Request): Response | null {
  if (request.method === "GET" || request.method === "HEAD") return null;
  const origin = request.headers.get("origin");
  if (origin === null || origin === new URL(request.url).origin) return null;
  return Response.json(
    { code: "FORBIDDEN", message: "Cross-origin requests aren't allowed." },
    { status: 403 },
  );
}

export function logUnexpectedError(error: unknown) {
  if (
    error instanceof ORPCError &&
    (error.defined || error.code === "BAD_REQUEST")
  ) {
    return;
  }
  console.error(error);
}
