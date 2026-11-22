"use client";

import {
  EMBED_MESSAGE_SOURCE,
  isLoaderToWidgetMessage,
  MOBILE_MAX_WIDTH,
  type EmbedPosition,
  type WidgetLayoutState,
  type WidgetToLoaderMessage,
} from "@marshaldesk/shared/embed-protocol";
import { useCallback, useEffect, useRef, useState } from "react";

const INIT_TIMEOUT_MS = 1500;

export type EmbedPage = { page: string | null; referrer: string | null };

function originMatchesHost(origin: string, host: string): boolean {
  try {
    return new URL(origin).hostname.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

function isEmbedded(): boolean {
  return window.parent !== window;
}

// The iframe's own viewport is the iframe's size, so inside the loader it can't tell a phone apart.
function guessMobile(): boolean {
  return isEmbedded()
    ? window.screen.width <= MOBILE_MAX_WIDTH
    : window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;
}

/**
 * Talks to the embed loader on the customer's page. Loader messages count only when they come
 * from the parent window on the host the widget was loaded for.
 */
export function useEmbedBridge(host: string) {
  const [page, setPage] = useState<EmbedPage | null>(null);
  const [mobile, setMobile] = useState(false);
  const parentOrigin = useRef<string | null>(null);

  useEffect(() => {
    const embedded = isEmbedded();
    let initialized = false;

    function onMessage(event: MessageEvent) {
      if (!embedded || event.source !== window.parent) return;
      if (!originMatchesHost(event.origin, host)) return;
      const message: unknown = event.data;
      if (!isLoaderToWidgetMessage(message)) return;
      parentOrigin.current = event.origin;
      switch (message.type) {
        case "init":
          initialized = true;
          setMobile(message.mobile);
          setPage(
            (current) =>
              current ?? { page: message.page, referrer: message.referrer },
          );
          return;
        case "viewport":
          setMobile(message.mobile);
          return;
        default: {
          const unreachable: never = message;
          return unreachable;
        }
      }
    }

    window.addEventListener("message", onMessage);
    if (embedded) {
      const ready: WidgetToLoaderMessage = {
        source: EMBED_MESSAGE_SOURCE,
        type: "ready",
      };
      // Nothing sensitive, and the parent's origin isn't known until it answers.
      window.parent.postMessage(ready, "*");
    }
    const fallback = window.setTimeout(
      () => {
        if (initialized) return;
        setMobile(guessMobile());
        setPage(
          (current) =>
            current ?? { page: document.referrer || null, referrer: null },
        );
      },
      embedded ? INIT_TIMEOUT_MS : 0,
    );

    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(fallback);
    };
  }, [host]);

  const postLayout = useCallback(
    (state: WidgetLayoutState, position: EmbedPosition) => {
      if (!isEmbedded()) return;
      const message: WidgetToLoaderMessage = {
        source: EMBED_MESSAGE_SOURCE,
        type: "layout",
        state,
        position,
      };
      window.parent.postMessage(message, parentOrigin.current ?? "*");
    },
    [],
  );

  return { page, mobile, postLayout };
}
