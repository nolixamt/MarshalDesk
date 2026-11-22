const DOT_DELAYS_MS = [0, 160, 320];

export function TypingIndicator({ name }: { name: string }) {
  return (
    <div
      role="status"
      className="flex animate-fade-in items-center gap-2 text-xs text-muted-foreground motion-reduce:animate-none"
    >
      <span
        aria-hidden="true"
        className="flex h-7 items-center gap-1 rounded-xl bg-muted px-3"
      >
        {DOT_DELAYS_MS.map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      {name} is typing…
    </div>
  );
}
