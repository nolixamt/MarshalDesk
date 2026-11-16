"use client";

import { useEffect, useState } from "react";

const COOLDOWN_SECONDS = 60;

export function ResendCode({
  onResend,
}: {
  /** Resolves to true when a new code was sent, which restarts the cooldown. */
  onResend: () => Promise<boolean>;
}) {
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  async function resend() {
    setSending(true);
    const ok = await onResend();
    setSending(false);
    if (ok) {
      setSent(true);
      setSecondsLeft(COOLDOWN_SECONDS);
    }
  }

  const waiting = secondsLeft > 0;

  return (
    <p className="text-center text-sm text-muted-foreground">
      <span role="status">{sent && waiting ? "New code sent. " : ""}</span>
      {sent && waiting ? null : "Didn't get a code? "}
      {waiting ? (
        <span className="tabular-nums">Resend in {secondsLeft}s</span>
      ) : (
        <button
          type="button"
          onClick={resend}
          disabled={sending}
          className="text-white underline underline-offset-4 outline-none hover:text-white/80 focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Resend code"}
        </button>
      )}
    </p>
  );
}
