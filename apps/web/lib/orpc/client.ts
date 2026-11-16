import type { Contract } from "@marshaldesk/shared";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

declare global {
  var $client: ContractRouterClient<Contract> | undefined;
}

// On the server, instrumentation.ts sets globalThis.$client to an in-process
// client before any request, so SSR never goes over HTTP.
const link = new RPCLink({
  url: "/rpc",
  origin: () => {
    if (typeof window === "undefined") {
      throw new Error("The RPC link is only used in the browser");
    }
    return window.location.origin;
  },
});

export const client: ContractRouterClient<Contract> =
  globalThis.$client ?? createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
