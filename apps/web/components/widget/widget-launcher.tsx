import { ChevronDownIcon, MessageCircleIcon } from "lucide-react";

export function WidgetLauncher({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={open ? "Close chat" : "Open chat"}
      aria-expanded={open}
      onClick={onToggle}
      className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-[scale] duration-150 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]"
    >
      {open ? (
        <ChevronDownIcon className="size-6" />
      ) : (
        <MessageCircleIcon className="size-6" />
      )}
    </button>
  );
}
