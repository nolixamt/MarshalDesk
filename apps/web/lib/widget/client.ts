import type {
  Contract,
  WidgetBrowserDetails,
  WidgetSession,
} from "@marshaldesk/shared";
import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

type SessionParams = {
  workspaceId: string;
  host: string;
  details: WidgetBrowserDetails;
};

// localStorage can throw or be missing in third-party iframes, so the token also lives in memory.
let memoryToken: string | null = null;
let sessionParams: SessionParams | null = null;
let restarting: Promise<WidgetSession> | null = null;

function tokenKey(workspaceId: string): string {
  return `marshaldesk:visitor:${workspaceId}`;
}

function readStoredToken(workspaceId: string): string | null {
  try {
    return window.localStorage.getItem(tokenKey(workspaceId));
  } catch {
    return null;
  }
}

function storeToken(workspaceId: string, token: string | null) {
  memoryToken = token;
  try {
    if (token) {
      window.localStorage.setItem(tokenKey(workspaceId), token);
    } else {
      window.localStorage.removeItem(tokenKey(workspaceId));
    }
  } catch {
    // Storage is blocked: the in-memory token still works until the page reloads.
  }
}

function currentToken(): string | null {
  if (memoryToken) return memoryToken;
  return sessionParams ? readStoredToken(sessionParams.workspaceId) : null;
}

const link = new RPCLink({
  url: "/rpc",
  origin: () => window.location.origin,
  headers: () => {
    const token = currentToken();
    return token ? { authorization: `Bearer ${token}` } : {};
  },
});

export const widgetClient: ContractRouterClient<Contract> =
  createORPCClient(link);

export const widgetOrpc = createTanstackQueryUtils(widgetClient);

async function requestSession(
  params: SessionParams,
  token: string | null,
): Promise<WidgetSession> {
  const session = await widgetClient.widget.start({
    workspaceId: params.workspaceId,
    host: params.host,
    token,
    details: params.details,
  });
  storeToken(params.workspaceId, session.token);
  return session;
}

/** Starts or resumes the visitor's session. The server may refresh the token, so it's saved every time. */
export function startVisitorSession(
  params: SessionParams,
): Promise<WidgetSession> {
  sessionParams = params;
  return requestSession(
    params,
    memoryToken ?? readStoredToken(params.workspaceId),
  );
}

function restartVisitorSession(): Promise<WidgetSession> {
  const params = sessionParams;
  if (!params) {
    return Promise.reject(new Error("The widget session hasn't started"));
  }
  storeToken(params.workspaceId, null);
  restarting ??= requestSession(params, null).finally(() => {
    restarting = null;
  });
  return restarting;
}

function isVisitorUnauthorized(error: unknown): boolean {
  return error instanceof ORPCError && error.code === "VISITOR_UNAUTHORIZED";
}

/** Runs a visitor call, starting a fresh session once if the token was rejected. */
export async function withVisitor<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    if (!isVisitorUnauthorized(error)) throw error;
    await restartVisitorSession();
    return call();
  }
}
