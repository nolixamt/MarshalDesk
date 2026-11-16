"use client";

import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { railTileButtonClassName } from "./rail";

export type NavUserViewUser = {
  name: string;
  email: string;
  image: string | null;
};

function diceBearUrl(name: string): string {
  return `https://api.dicebear.com/10.x/notionists-neutral/svg?seed=${encodeURIComponent(name)}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1
      ? `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`
      : (parts[0]?.slice(0, 2) ?? "");
  return letters.toUpperCase();
}

function UserAvatar({
  user,
  className,
}: {
  user: NavUserViewUser;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const useImage = user.image !== null && !imageFailed;
  const src = useImage && user.image ? user.image : diceBearUrl(user.name);

  return (
    <Avatar className={cn("size-8 rounded-lg after:rounded-lg", className)}>
      <AvatarImage
        key={src}
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        className="rounded-lg bg-muted"
        onLoadingStatusChange={(status) => {
          if (status === "error" && useImage) {
            setImageFailed(true);
          }
        }}
      />
      <AvatarFallback delay={600} className="rounded-lg text-xs font-medium">
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function UserDetails({ user }: { user: NavUserViewUser }) {
  return (
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium text-foreground">{user.name}</span>
      <span className="truncate text-xs text-foreground/75">{user.email}</span>
    </div>
  );
}

export function NavUserView({
  user,
  workspaceName,
  onSignOut,
}: {
  user: NavUserViewUser;
  workspaceName?: string;
  onSignOut: () => void;
}) {
  const { isMobile, state } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                aria-label={`Account menu for ${user.name}`}
                className={cn(
                  railTileButtonClassName,
                  "gap-2.5 data-popup-open:bg-sidebar-accent",
                )}
              />
            }
          >
            <UserAvatar user={user} />
            <UserDetails user={user} />
            <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-60"
            side={isMobile ? "bottom" : state === "collapsed" ? "right" : "top"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2.5 px-1.5 py-1.5">
                  <UserAvatar user={user} />
                  <UserDetails user={user} />
                </div>
                {workspaceName ? (
                  <p className="truncate px-1.5 pb-1.5 text-xs text-foreground/75">
                    Workspace: {workspaceName}
                  </p>
                ) : null}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut}>
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function NavUserSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex h-12 items-center gap-2.5 p-1.5">
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <div className="grid flex-1 gap-1.5 group-data-[collapsible=icon]:hidden">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
