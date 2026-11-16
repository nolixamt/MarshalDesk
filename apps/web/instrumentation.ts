export async function register() {
  // oRPC's SSR setup: the in-process client must exist before any server
  // render reads globalThis.$client, and only in the Node.js runtime.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/orpc/client.server");
  }
}
