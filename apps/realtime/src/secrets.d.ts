// Secrets aren't in wrangler.jsonc, so `wrangler types` only sees them when a local .dev.vars
// exists. Declaring them here keeps the type check the same on every machine.
declare namespace Cloudflare {
  interface Env {
    REALTIME_TOKEN_SECRET: string;
    REALTIME_PUBLISH_SECRET: string;
  }
}
