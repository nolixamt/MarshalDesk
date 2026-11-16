import "server-only";
import { findWorkspaceForUser, type WorkspaceSummary } from "@marshaldesk/db";
import { redirect } from "next/navigation";
import { cache } from "react";
import { requestHeaders } from "@/lib/auth/request-headers";
import { getSessionUser, type SessionUser } from "@/lib/auth/server";

export type Viewer =
  | { status: "signed-out" }
  | { status: "unverified"; user: SessionUser }
  | { status: "needs-workspace"; user: SessionUser }
  | { status: "ready"; user: SessionUser; workspace: WorkspaceSummary };

export const getViewer = cache(async (): Promise<Viewer> => {
  const user = await getSessionUser(await requestHeaders());
  if (!user) return { status: "signed-out" };
  if (!user.emailVerified) return { status: "unverified", user };

  const workspace = await findWorkspaceForUser(user.id);
  if (!workspace) return { status: "needs-workspace", user };
  return { status: "ready", user, workspace };
});

export function verifyEmailPath(email: string) {
  return `/auth/verify-email?${new URLSearchParams({ email })}`;
}

export async function requireReadyViewer() {
  const viewer = await getViewer();
  switch (viewer.status) {
    case "signed-out":
      redirect("/auth/sign-in");
    case "unverified":
      redirect(verifyEmailPath(viewer.user.email));
    case "needs-workspace":
      redirect("/auth/welcome");
    case "ready":
      return viewer;
    default: {
      const unreachable: never = viewer;
      return unreachable;
    }
  }
}
