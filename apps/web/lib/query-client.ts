import { RPCJsonSerializer } from "@orpc/client";
import { createHydrationOptions } from "@orpc/tanstack-query";
import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";

const hydration = createHydrationOptions(new RPCJsonSerializer());

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000 },
      dehydrate: {
        ...hydration.dehydrate,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: hydration.hydrate,
    },
  });
}
