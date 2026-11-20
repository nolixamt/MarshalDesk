import { cn } from "cn";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type WidgetMessageAuthor =
  { role: "visitor" } | { role: "agent"; name: string; avatarUrl: string };

export function WidgetMessage({
  author,
  children,
}: {
  author: WidgetMessageAuthor;
  children: React.ReactNode;
}) {
  switch (author.role) {
    case "visitor":
      return (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-xl rounded-br-sm bg-primary px-3 py-2 text-sm/relaxed whitespace-pre-wrap text-primary-foreground">
            {children}
          </div>
        </div>
      );
    case "agent":
      return (
        <div className="flex items-end gap-2">
          <Avatar size="sm">
            <AvatarImage src={author.avatarUrl} alt="" />
            <AvatarFallback>
              {author.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex max-w-[85%] min-w-0 flex-col gap-1">
            <p className="truncate text-xs text-muted-foreground">
              {author.name}
            </p>
            <div
              className={cn(
                "rounded-xl rounded-bl-sm bg-muted px-3 py-2 text-sm/relaxed break-words whitespace-pre-wrap",
              )}
            >
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
