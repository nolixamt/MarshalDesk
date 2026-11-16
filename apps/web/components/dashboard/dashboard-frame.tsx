"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppSidebar } from "./app-sidebar";
import { SIDEBAR_WIDTH_ICON } from "./rail";
import { SiteHeader } from "./site-header";

export function DashboardFrame({
  defaultOpen,
  account,
  children,
}: {
  defaultOpen: boolean;
  account: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delay={400}>
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={
          { "--sidebar-width-icon": SIDEBAR_WIDTH_ICON } as React.CSSProperties
        }
      >
        <AppSidebar account={account} />
        <SidebarInset className="min-w-0 md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:ring-1 md:peer-data-[variant=inset]:ring-foreground/10">
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
