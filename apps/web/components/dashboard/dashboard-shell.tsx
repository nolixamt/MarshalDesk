import { Suspense } from "react";

import { DashboardFrame } from "./dashboard-frame";
import { NavUser } from "./nav-user";
import { NavUserSkeleton } from "./nav-user-view";

export function DashboardShell({
  defaultOpen,
  children,
}: {
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <DashboardFrame
      defaultOpen={defaultOpen}
      account={
        <Suspense fallback={<NavUserSkeleton />}>
          <NavUser />
        </Suspense>
      }
    >
      {children}
    </DashboardFrame>
  );
}
