"use client";

import { createAuthClient } from "@neon/auth/next";

export const authClient = createAuthClient();

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Magic links and Google return through the proxy, which exchanges the
// session verifier, so every callback must land inside /dashboard.
export const dashboardCallbackUrl = new URL("/dashboard", appUrl).toString();
