import { auth } from "@/lib/auth/server";

// Optimistic gate only: it also exchanges the OAuth and magic-link session
// verifier. Viewer routing and ownerProcedure do the real checks.
export default auth.middleware({ loginUrl: "/auth/sign-in" });

export const config = {
  matcher: ["/dashboard/:path*"],
};
