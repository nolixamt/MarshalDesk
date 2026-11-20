import { cn } from "cn";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type WidgetMessageAuthor =
  | { role: "visitor" }
  | { role: "agent"; name: string; avatarUrl: string }
  | {
      role: "member";
      name: string;
      avatarUrl: string;
      /** Shown when the member's photo fails to load. */
      fallbackAvatarUrl: string;
    };

export type WidgetMessageDelivery = "sent" | "sending" | "failed";

function DeliveryNote({
  delivery,
  onRetry,
}: {
  delivery: WidgetMessageDelivery;
  onRetry?: () => void;
}) {
  switch (delivery) {
    case "sent":
      return null;
    case "sending":
      return <p className="text-xs text-muted-foreground">Sending…</p>;
    case "failed":
      return (
        <p className="text-xs text-destructive">
          Not sent.{" "}
          <button
            type="button"
            onClick={onRetry}
            className="font-medium underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Try again
          </button>
        </p>
      );
    default: {
      const unreachable: never = delivery;
      return unreachable;
    }
  }
}

export function WidgetMessage({
  author,
  delivery = "sent",
  onRetry,
  className,
  children,
}: {
  author: WidgetMessageAuthor;
  delivery?: WidgetMessageDelivery;
  onRetry?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  switch (author.role) {
    case "visitor":
      return (
        <div className={cn("flex flex-col items-end gap-1", className)}>
          <div
            className={cn(
              "max-w-[85%] rounded-xl rounded-br-sm bg-primary px-3 py-2 text-sm/relaxed break-words whitespace-pre-wrap text-primary-foreground",
              delivery === "sending" && "opacity-70",
            )}
          >
            {children}
          </div>
          <DeliveryNote delivery={delivery} onRetry={onRetry} />
        </div>
      );
    case "agent":
    case "member":
      return (
        <div className={cn("flex items-end gap-2", className)}>
          <Avatar size="sm">
            <AvatarImage
              src={author.avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
            />
            <AvatarFallback>
              {author.role === "member" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={author.fallbackAvatarUrl}
                  alt=""
                  className="size-full rounded-full"
                />
              ) : (
                author.name.slice(0, 1).toUpperCase()
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex max-w-[85%] min-w-0 flex-col gap-1">
            <p className="truncate text-xs text-muted-foreground">
              {author.name}
            </p>
            <div className="rounded-xl rounded-bl-sm bg-muted px-3 py-2 text-sm/relaxed break-words whitespace-pre-wrap">
              {children}
            </div>
          </div>
        </div>
      );
    default: {
      const unreachable: never = author;
      return unreachable;
    }
  }
}

export function WidgetNotice({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      role="status"
      className={cn(
        "mx-auto max-w-[85%] rounded-lg bg-muted/60 px-3 py-2 text-center text-xs/relaxed text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}
