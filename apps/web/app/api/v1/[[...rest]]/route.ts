import { OpenAPIGenerator } from "@orpc/openapi";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferenceHandlerPlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { errorStatusMap } from "@/lib/orpc/errors";
import {
  logUnexpectedError,
  rejectCrossOrigin,
} from "@/lib/orpc/handler-guards";
import { router } from "@/lib/orpc/router";

// Mounted under /api/v1 so it never shadows Neon Auth's /api/auth routes.
const prefix = "/api/v1";

const generator = new OpenAPIGenerator({
  converters: [new ZodToJsonSchemaConverter()],
});

const handler = new OpenAPIHandler(router, {
  errorStatusMap,
  interceptors: [onError(logUnexpectedError)],
  plugins: [
    new OpenAPIReferenceHandlerPlugin({
      specPath: "/spec.json",
      docsPath: "/docs",
      spec: () =>
        generator.generate(router, {
          errorStatusMap,
          base: {
            info: { title: "MarshalDesk API", version: "0.1.0" },
            servers: [{ url: prefix }],
          },
        }),
    }),
  ],
});

async function handleRequest(request: Request) {
  const rejected = rejectCrossOrigin(request);
  if (rejected) return rejected;
  const { matched, response } = await handler.handle(request, {
    prefix,
    context: { headers: request.headers },
  });
  return matched ? response : new Response("Not found", { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
