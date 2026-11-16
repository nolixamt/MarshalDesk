const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Better Auth redirects here (adding its own `error` param) when a magic link
// is expired or already used. It must be absolute, like the success callback.
export const magicLinkErrorCallbackUrl = new URL(
  "/auth/sign-in?link=expired",
  appUrl,
).toString();

export function verifyEmailHref(email: string) {
  return `/auth/verify-email?email=${encodeURIComponent(email)}`;
}
