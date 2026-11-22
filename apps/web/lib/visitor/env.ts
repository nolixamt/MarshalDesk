import "server-only";
import * as z from "zod";

export const visitorEnv = z
  .object({ VISITOR_TOKEN_SECRET: z.string().min(32) })
  .parse({ VISITOR_TOKEN_SECRET: process.env.VISITOR_TOKEN_SECRET });
