import { isDefinedError } from "@orpc/client";
import { useCallback, useState } from "react";

/**
 * Stops a socket from reconnecting once the API rejects its token request with a defined error
 * (signed out, no workspace, conversation gone…): retrying can't succeed until the room changes.
 * Network errors and a Worker that's down still reconnect with backoff.
 */
export function useTokenRejection(room: string | null) {
  const [rejected, setRejected] = useState<{ room: string | null } | null>(
    null,
  );

  if (rejected !== null && rejected.room !== room) setRejected(null);

  const guard = useCallback(
    async <T>(fetchToken: () => Promise<T>): Promise<T> => {
      try {
        return await fetchToken();
      } catch (error) {
        if (isDefinedError(error)) {
          setRejected((current) =>
            current?.room === room ? current : { room },
          );
        }
        throw error;
      }
    },
    [room],
  );

  return { rejected: rejected !== null && rejected.room === room, guard };
}
