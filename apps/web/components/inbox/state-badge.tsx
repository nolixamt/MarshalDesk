import type { ConversationState } from "@marshaldesk/shared";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { stateLabel } from "./labels";

export function StateBadge({
  state,
  className,
}: {
  state: ConversationState;
  className?: string;
}) {
  return (
    <Badge
      variant={state === "waiting" ? "default" : "outline"}
      className={cn(
        state === "waiting"
          ? "border-transparent"
          : "border-foreground/10 text-muted-foreground",
        className,
      )}
    >
      {stateLabel(state)}
    </Badge>
  );
}
