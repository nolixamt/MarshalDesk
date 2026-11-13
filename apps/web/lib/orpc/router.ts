import "server-only";
import { contract } from "@marshaldesk/shared";
import { implement } from "@orpc/server";

export type BaseContext = { headers: Headers };

const os = implement(contract).$context<BaseContext>();

export const router = os.router({
  health: {
    ping: os.health.ping.handler(() => ({
      status: "ok" as const,
      time: new Date().toISOString(),
    })),
  },
});
