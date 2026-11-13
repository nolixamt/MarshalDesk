import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trust } from "./content";

const lifts = [
  "hover:-translate-y-0.5",
  "hover:-translate-y-1",
  "hover:-translate-y-0.5",
];
const layers = ["z-1", "z-2", "z-4"];

export function TrustRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center [--trust-size:clamp(36px,4.5vw,42px)] max-xs:[--trust-size:34px]",
        className,
      )}
    >
      <AvatarGroup className="-space-x-[calc(var(--trust-size)*0.42)]">
        {trust.items.map(({ label, icon: Icon }, i) => (
          <Avatar
            key={label}
            className={cn(
              "relative size-(--trust-size) border border-ink-line bg-ink p-[5px] ring-0! transition-[translate] duration-350 ease-out-expo after:hidden",
              lifts[i],
              layers[i],
            )}
          >
            <AvatarFallback className="bg-white text-[#111]">
              <Icon
                aria-hidden="true"
                className="size-[calc(var(--trust-size)*0.34)]"
                strokeWidth={2.25}
              />
              <span className="sr-only">{label}</span>
            </AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>
      <Badge
        variant="ink"
        className="relative z-3 -ml-[calc(var(--trust-size)*0.42)] h-(--trust-size) pr-[clamp(14px,1.6vw,18px)] pl-[calc(var(--trust-size)*0.58)] text-[clamp(12px,1.4vw,13.5px)] max-nav:text-xs"
      >
        {trust.claim}
      </Badge>
    </div>
  );
}
