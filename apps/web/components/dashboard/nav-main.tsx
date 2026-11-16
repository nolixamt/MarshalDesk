"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { isNavItemActive, navItems } from "./nav-items";
import { railButtonClassName, railTooltipClassName } from "./rail";

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {navItems.map((item) => {
            const active = isNavItemActive(item, pathname);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={active}
                  tooltip={{
                    children: item.title,
                    className: railTooltipClassName,
                  }}
                  className={railButtonClassName}
                  render={
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                    />
                  }
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
