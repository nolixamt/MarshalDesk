import { useState } from "react";

type Arrivals = {
  scope: string | null;
  known: ReadonlySet<string>;
  arrived: ReadonlySet<string>;
};

const NONE: ReadonlySet<string> = new Set();

/**
 * Returns the ids that appeared after the first render of `scope`, so only
 * things that arrive while the page is open animate. A new scope (for example
 * opening another conversation) starts a fresh baseline.
 */
export function useArrivals(
  ids: readonly string[],
  scope: string | null,
): ReadonlySet<string> {
  const [arrivals, setArrivals] = useState<Arrivals>(() => ({
    scope,
    known: new Set(ids),
    arrived: NONE,
  }));

  if (arrivals.scope !== scope) {
    setArrivals({ scope, known: new Set(ids), arrived: NONE });
    return NONE;
  }

  const fresh = ids.filter((id) => !arrivals.known.has(id));
  if (fresh.length > 0) {
    const next: Arrivals = {
      scope,
      known: new Set([...arrivals.known, ...fresh]),
      arrived: new Set([...arrivals.arrived, ...fresh]),
    };
    setArrivals(next);
    return next.arrived;
  }

  return arrivals.arrived;
}
