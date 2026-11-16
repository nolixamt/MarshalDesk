"use client";

import Link from "next/link";

import { LogoMark } from "@/components/brand/logo-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { NavMain } from "./nav-main";
import { railTileButtonClassName } from "./rail";

export function AppSidebar({ account }: { account: React.ReactNode }) {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className={cn(railTileButtonClassName, "gap-2.5")}
              render={<Link href="/dashboard" aria-label="MarshalDesk home" />}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background [--logo-dots:var(--foreground)]">
                <LogoMark className="size-5!" />
              </span>
              <span className="text-base font-semibold tracking-[-0.02em]">
                MarshalDesk
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>{account}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
