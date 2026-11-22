import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireReadyViewer } from "@/lib/auth/viewer";
import { orpc } from "@/lib/orpc/client";
import { makeQueryClient } from "@/lib/query-client";

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-sidebar" />}>
      <DashboardGate>{children}</DashboardGate>
    </Suspense>
  );
}

async function DashboardGate({ children }: { children: React.ReactNode }) {
  await requireReadyViewer();

  const queryClient = makeQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(orpc.owner.getCurrent.queryOptions()),
    queryClient.prefetchQuery(orpc.widgetSettings.get.queryOptions()),
  ]);
  const sidebarState = (await cookies()).get("sidebar_state")?.value;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardShell defaultOpen={sidebarState !== "false"}>
        {children}
      </DashboardShell>
    </HydrationBoundary>
  );
}
