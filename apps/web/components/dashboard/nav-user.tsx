"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { authCall } from "@/components/auth/auth-errors";
import { authClient } from "@/lib/auth/client";
import { orpc } from "@/lib/orpc/client";

import { NavUserView } from "./nav-user-view";

export function NavUser() {
  const { data } = useSuspenseQuery(orpc.owner.getCurrent.queryOptions());

  async function signOut() {
    const { error } = await authCall(authClient.signOut());
    if (error) return;
    // A full navigation drops every cached query and the hidden dashboard Activity.
    window.location.assign(new URL("/auth/sign-in", window.location.origin));
  }

  return (
    <NavUserView
      user={data.user}
      workspaceName={data.workspace.name}
      onSignOut={() => void signOut()}
    />
  );
}
