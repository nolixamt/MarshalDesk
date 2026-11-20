import { cn } from "cn";

import { agentAvatarUrl } from "@/lib/avatars";

export type WidgetAccent = { hex: string; foreground: string };

export function resolveAgentAvatarUrl(
  agentName: string,
  uploadedUrl: string | null,
  accent: WidgetAccent,
): string {
  return uploadedUrl ?? agentAvatarUrl(agentName, accent.hex);
}

// Scopes the accent to the widget, so shadcn controls inside it (send button, focus rings) follow it.
export function WidgetTheme({
  accent,
  className,
  children,
}: {
  accent: WidgetAccent;
  className?: string;
  children: React.ReactNode;
}) {
  const style = {
    "--primary": accent.hex,
    "--primary-foreground": accent.foreground,
    "--ring": accent.hex,
  } as React.CSSProperties;

  return (
    <div className={cn("text-foreground", className)} style={style}>
      {children}
    </div>
  );
}
