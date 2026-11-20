// The snippet customers paste: <script src="https://app/embed.js" data-workspace="…" async>.
// It only places one iframe; the iframe renders the launcher and the chat, and tells this loader
// which size and corner to use.
import {
  EMBED_MESSAGE_SOURCE,
  isWidgetToLoaderMessage,
  MOBILE_MAX_WIDTH,
  type LoaderToWidgetMessage,
  type WidgetLayoutState,
  type EmbedPosition,
} from "@marshaldesk/shared/embed-protocol";

declare global {
  interface Window {
    __marshaldeskWidget?: boolean;
  }
}

const COLLAPSED_SIZE = 88;
const OPEN_WIDTH = 416;
const OPEN_MAX_HEIGHT = 720;

function start(script: HTMLScriptElement) {
  if (window.__marshaldeskWidget) return;
  const workspaceId = script.dataset.workspace;
  if (!workspaceId) {
    console.warn("MarshalDesk: the snippet is missing data-workspace.");
    return;
  }
  window.__marshaldeskWidget = true;

  const appOrigin = new URL(script.src).origin;
  const iframeUrl = new URL(
    `/widget/${encodeURIComponent(workspaceId)}`,
    appOrigin,
  );
  iframeUrl.searchParams.set("host", window.location.hostname);

  const iframe = document.createElement("iframe");
  iframe.src = iframeUrl.toString();
  iframe.title = "Chat";
  iframe.setAttribute("allow", "autoplay");
  const base: Partial<CSSStyleDeclaration> = {
    position: "fixed",
    bottom: "0",
    border: "0",
    margin: "0",
    padding: "0",
    background: "transparent",
    colorScheme: "light",
    zIndex: "2147483000",
    display: "none",
    maxWidth: "100%",
  };
  Object.assign(iframe.style, base);

  let state: WidgetLayoutState = "hidden";
  let position: EmbedPosition = "bottom-right";
  let savedOverflow: string | null = null;

  const isMobile = () => window.innerWidth <= MOBILE_MAX_WIDTH;

  function post(message: LoaderToWidgetMessage) {
    iframe.contentWindow?.postMessage(message, appOrigin);
  }

  function lockScroll(lock: boolean) {
    const root = document.documentElement;
    if (lock && savedOverflow === null) {
      savedOverflow = root.style.overflow;
      root.style.overflow = "hidden";
    } else if (!lock && savedOverflow !== null) {
      root.style.overflow = savedOverflow;
      savedOverflow = null;
    }
  }

  function applyLayout() {
    const style = iframe.style;
    style.left = position === "bottom-left" ? "0" : "auto";
    style.right = position === "bottom-right" ? "0" : "auto";
    style.top = "auto";
    switch (state) {
      case "hidden":
        style.display = "none";
        lockScroll(false);
        return;
      case "collapsed":
        style.display = "block";
        style.width = `${COLLAPSED_SIZE}px`;
        style.height = `${COLLAPSED_SIZE}px`;
        lockScroll(false);
        return;
      case "open":
        style.display = "block";
        if (isMobile()) {
          style.left = "0";
          style.right = "0";
          style.top = "0";
          style.width = "100%";
          style.height = "100dvh";
          lockScroll(true);
        } else {
          style.width = `${OPEN_WIDTH}px`;
          style.height = `min(${OPEN_MAX_HEIGHT}px, 100dvh)`;
          lockScroll(false);
        }
        return;
      default: {
        const unreachable: never = state;
        return unreachable;
      }
    }
  }

  window.addEventListener("message", (event) => {
    if (event.origin !== appOrigin || event.source !== iframe.contentWindow) {
      return;
    }
    const message: unknown = event.data;
    if (!isWidgetToLoaderMessage(message)) return;
    switch (message.type) {
      case "ready":
        post({
          source: EMBED_MESSAGE_SOURCE,
          type: "init",
          page: window.location.href,
          referrer: document.referrer || null,
          mobile: isMobile(),
        });
        return;
      case "layout":
        state = message.state;
        position = message.position;
        applyLayout();
        return;
      default: {
        const unreachable: never = message;
        return unreachable;
      }
    }
  });

  let wasMobile = isMobile();
  window.addEventListener("resize", () => {
    const mobile = isMobile();
    if (mobile !== wasMobile) {
      wasMobile = mobile;
      post({ source: EMBED_MESSAGE_SOURCE, type: "viewport", mobile });
    }
    applyLayout();
  });

  document.body.appendChild(iframe);
}

// currentScript is only set while this file first runs, so read it now: an async snippet in
// <head> can run before <body> exists, and then start() runs later from DOMContentLoaded.
const currentScript = document.currentScript;
if (currentScript instanceof HTMLScriptElement) {
  if (document.body) {
    start(currentScript);
  } else {
    document.addEventListener("DOMContentLoaded", () => start(currentScript), {
      once: true,
    });
  }
}
