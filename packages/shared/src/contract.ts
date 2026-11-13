import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";
import * as z from "zod";

export const healthSchema = z.object({
  status: z.literal("ok"),
  time: z.iso.datetime(),
});
export type Health = z.infer<typeof healthSchema>;

export const contract = {
  health: {
    ping: oc
      .meta(
        openapi({
          method: "GET",
          path: "/health",
          summary: "Check that the API is up",
          tags: ["Health"],
        }),
      )
      .output(healthSchema),
  },
};

export type Contract = typeof contract;
