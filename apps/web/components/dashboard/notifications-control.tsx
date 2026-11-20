"use client";

import { BellIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  requestNotificationPermission,
  useNotificationPermission,
} from "@/lib/inbox/browser-notifications";

export function NotificationsControl() {
  const permission = useNotificationPermission();

  switch (permission) {
    case "granted":
    case "unsupported":
      return null;
    case "denied":
      return (
        <p className="text-xs text-muted-foreground">
          Notifications are blocked. Allow them in your browser&apos;s site
          settings.
        </p>
      );
    case "default":
      return (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => void requestNotificationPermission()}
        >
          <BellIcon data-icon="inline-start" />
          Enable notifications
        </Button>
      );
    default: {
      const unhandled: never = permission;
      return unhandled;
    }
  }
}
