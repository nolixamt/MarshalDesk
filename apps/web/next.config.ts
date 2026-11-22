import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The default bottom-left badge covers the sidebar account button.
  devIndicators: { position: "bottom-right" },
  experimental: {
    // Dashboard and auth pages redirect from a viewer gate while rendering,
    // which implicit instant-UI validation reports as an error on every
    // redirect. Validate only segments that opt in with `instant`.
    instantInsights: { validationLevel: "manual-warning" },
  },
  // The loader keeps a stable filename, so caches only hold it for five minutes.
  async headers() {
    return [
      {
        source: "/embed.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=300" }],
      },
    ];
  },
  partialPrefetching: true,
  transpilePackages: ["@marshaldesk/shared", "@marshaldesk/db"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
