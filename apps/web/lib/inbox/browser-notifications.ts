import { useSyncExternalStore } from "react";

export type NotificationPermissionState =
  NotificationPermission | "unsupported";

const listeners = new Set<() => void>();

function isSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

function getPermission(): NotificationPermissionState {
  return isSupported() ? Notification.permission : "unsupported";
}

function getServerPermission(): NotificationPermissionState {
  return "unsupported";
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  let status: PermissionStatus | null = null;
  let active = true;
  navigator.permissions
    ?.query({ name: "notifications" })
    .then((result) => {
      if (!active) return;
      status = result;
      result.addEventListener("change", onChange);
    })
    .catch(() => undefined);
  return () => {
    active = false;
    listeners.delete(onChange);
    status?.removeEventListener("change", onChange);
  };
}

export function useNotificationPermission(): NotificationPermissionState {
  return useSyncExternalStore(subscribe, getPermission, getServerPermission);
}

/** Only call this from a click: browsers ignore or penalize prompts that aren't user-initiated. */
export async function requestNotificationPermission(): Promise<void> {
  if (!isSupported()) return;
  try {
    await Notification.requestPermission();
  } finally {
    for (const listener of listeners) listener();
  }
}

export function showBrowserNotification({
  title,
  body,
  tag,
  onClick,
}: {
  title: string;
  body: string;
  tag: string;
  onClick: () => void;
}): void {
  if (getPermission() !== "granted") return;
  try {
    const notification = new Notification(title, { body, tag });
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  } catch {
    // Some browsers only allow notifications from a service worker; sound and the badge still work.
  }
}
