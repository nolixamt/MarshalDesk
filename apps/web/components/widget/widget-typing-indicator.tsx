import { WidgetMessage, type WidgetMessageAuthor } from "./widget-message";

export function WidgetTypingIndicator({
  author,
  className,
}: {
  author: Exclude<WidgetMessageAuthor, { role: "visitor" }>;
  className?: string;
}) {
  return (
    <WidgetMessage author={author} className={className}>
      <span className="flex h-[1lh] items-center gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            aria-hidden
            className="size-1.5 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
        <span className="sr-only">{author.name} is typing…</span>
      </span>
    </WidgetMessage>
  );
}
