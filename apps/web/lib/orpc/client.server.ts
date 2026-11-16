import { createRouterClient } from "@orpc/server";
import { requestHeaders } from "@/lib/auth/request-headers";
import { router } from "@/lib/orpc/router";

// Server-side client: calls procedures in-process with the incoming request's
// headers. oRPC's SSR guide forbids importing "server-only" in this module.
globalThis.$client = createRouterClient(router, {
  context: async () => ({ headers: await requestHeaders() }),
});
