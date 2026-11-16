const messages: Record<string, string> = {
  EMAIL_NOT_VERIFIED: "Verify your email to continue.",
  USER_ALREADY_EXISTS:
    "An account with this email already exists. Sign in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "An account with this email already exists. Sign in instead.",
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match.",
  INVALID_OTP: "That code isn't right. Check it and try again.",
  OTP_EXPIRED: "That code has expired. Send a new one.",
  TOO_MANY_ATTEMPTS: "Too many attempts. Send a new code and try again.",
};

export type AuthFailure = { code: string | undefined };

const codeErrors = new Set(["INVALID_OTP", "OTP_EXPIRED", "TOO_MANY_ATTEMPTS"]);

/** The entered one-time code was wrong, expired, or used up. */
export function isCodeError(error: AuthFailure): boolean {
  return error.code !== undefined && codeErrors.has(error.code);
}

export function authErrorMessage(error: AuthFailure): string {
  const known = error.code ? messages[error.code] : undefined;
  return known ?? "Something went wrong. Please try again.";
}

function stringProp(value: unknown, key: string): string | undefined {
  if (typeof value !== "object" || value === null || !(key in value)) {
    return undefined;
  }
  const prop: unknown = Reflect.get(value, key);
  return typeof prop === "string" ? prop : undefined;
}

// The Neon client throws an AuthApiError on non-2xx responses (raw Better Auth
// code on `.error.code`) instead of resolving to `{ error }`, so handle both.
export async function authCall<D>(
  call: Promise<{ data: D | null; error: unknown }>,
): Promise<{ data: D | null; error: AuthFailure | null }> {
  try {
    const { data, error } = await call;
    if (error)
      return { data: null, error: { code: stringProp(error, "code") } };
    return { data, error: null };
  } catch (thrown) {
    const raw =
      typeof thrown === "object" && thrown !== null && "error" in thrown
        ? thrown.error
        : undefined;
    return {
      data: null,
      error: { code: stringProp(raw, "code") ?? stringProp(thrown, "code") },
    };
  }
}
