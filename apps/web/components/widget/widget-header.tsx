"use client";

import { XIcon } from "lucide-react";

import { IconButton } from "@/components/dashboard/icon-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function WidgetHeader({
  agentName,
  avatarUrl,
  status,
  onClose,
}: {
  agentName: string;
  avatarUrl: string;
  status: string;
  onClose?: () => void;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-foreground/10 px-4 py-3">
      <Avatar size="lg">
        <AvatarImage src={avatarUrl} alt="" />
        <AvatarFallback>{agentName.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold tracking-[-0.01em]">{agentName}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span aria-hidden className="size-1.5 rounded-full bg-primary" />
          {status}
        </p>
      </div>
      <IconButton label="Close" onClick={onClose}>
        <XIcon />
      </IconButton>
    </header>
  );
}
