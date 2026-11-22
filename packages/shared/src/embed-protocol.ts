// postMessage protocol between the embed loader (customer page) and the widget iframe.
// Dependency-free on purpose: esbuild bundles this into public/embed.js.

export const EMBED_MESSAGE_SOURCE = "marshaldesk";

export type WidgetLayoutState = "hidden" | "collapsed" | "open";
export type EmbedPosition = "bottom-left" | "bottom-right";

/** Sent by the iframe to the loader. */
export type WidgetToLoaderMessage =
  | { source: typeof EMBED_MESSAGE_SOURCE; type: "ready" }
  | {
      source: typeof EMBED_MESSAGE_SOURCE;
      type: "layout";
      state: WidgetLayoutState;
      position: EmbedPosition;
    };

/** Sent by the loader to the iframe. */
export type LoaderToWidgetMessage =
  | {
      source: typeof EMBED_MESSAGE_SOURCE;
      type: "init";
      page: string;
      referrer: string | null;
      mobile: boolean;
    }
  | { source: typeof EMBED_MESSAGE_SOURCE; type: "viewport"; mobile: boolean };

// Phones get the open widget full-screen.
export const MOBILE_MAX_WIDTH = 640;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPosition(value: unknown): value is EmbedPosition {
  return value === "bottom-left" || value === "bottom-right";
}

export function isWidgetToLoaderMessage(
  value: unknown,
): value is WidgetToLoaderMessage {
  if (!isRecord(value) || value.source !== EMBED_MESSAGE_SOURCE) return false;
  switch (value.type) {
    case "ready":
      return true;
    case "layout":
      return (
        (value.state === "hidden" ||
          value.state === "collapsed" ||
          value.state === "open") &&
        isPosition(value.position)
      );
    default:
      return false;
  }
}

export function isLoaderToWidgetMessage(
  value: unknown,
): value is LoaderToWidgetMessage {
  if (!isRecord(value) || value.source !== EMBED_MESSAGE_SOURCE) return false;
  switch (value.type) {
    case "init":
      return (
        typeof value.page === "string" &&
        (value.referrer === null || typeof value.referrer === "string") &&
        typeof value.mobile === "boolean"
      );
    case "viewport":
      return typeof value.mobile === "boolean";
    default:
      return false;
  }
}
