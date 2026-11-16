"use client";

import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { getPageTitle } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-foreground/10">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1.5" />
        <Separator
          orientation="vertical"
          className="mx-1 h-4 data-vertical:self-auto"
        />
        <p className="text-sm font-medium">{getPageTitle(pathname)}</p>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
