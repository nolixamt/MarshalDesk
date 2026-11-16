"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient, dashboardCallbackUrl } from "@/lib/auth/client";
import { authCall, authErrorMessage } from "./auth-errors";

export function GoogleButton({
  disabled,
  onError,
}: {
  disabled?: boolean;
  onError: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);

  async function signInWithGoogle() {
    setPending(true);
    const { error } = await authCall(
      authClient.signIn.social({
        provider: "google",
        callbackURL: dashboardCallbackUrl,
      }),
    );
    // On success the browser is already navigating to Google.
    if (error) {
      setPending(false);
      onError(authErrorMessage(error));
    }
  }

  return (
    <Button
      type="button"
      variant="form-secondary"
      size="field"
      className="w-full"
      disabled={disabled || pending}
      onClick={signInWithGoogle}
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" />
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.08 1.08-2.76 2.26-5.7 2.26-4.55 0-8.12-3.67-8.12-8.22s3.57-8.22 8.12-8.22c2.45 0 4.24.97 5.56 2.2l2.31-2.31C18.75 2.1 16.23.8 12.48.8 5.97.8.5 6.12.5 12.62s5.47 11.82 11.98 11.82c3.52 0 6.17-1.15 8.24-3.31 2.13-2.13 2.8-5.13 2.8-7.55 0-.75-.06-1.44-.17-2.02z"
          />
        </svg>
      )}
      Continue with Google
    </Button>
  );
}
