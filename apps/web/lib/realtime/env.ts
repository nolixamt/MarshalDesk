import "server-only";
import * as z from "zod";

export const realtimeEnv = z
  .object({
    REALTIME_URL: z.url(),
    REALTIME_TOKEN_SECRET: z.string().min(32),
    REALTIME_PUBLISH_SECRET: z.string().min(32),
  })
  .parse({
    REALTIME_URL: process.env.REALTIME_URL,
    REALTIME_TOKEN_SECRET: process.env.REALTIME_TOKEN_SECRET,
    REALTIME_PUBLISH_SECRET: process.env.REALTIME_PUBLISH_SECRET,
  });
