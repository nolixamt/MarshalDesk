"use client";

import type { AgentTurn } from "@marshaldesk/shared";
import { ChevronRightIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

import { classificationLabel, outcomeLabel } from "./labels";

const numberFormat = new Intl.NumberFormat("en-US");

function formatLatency(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

export function AgentTurnDetails({
  turn,
  align,
}: {
  turn: AgentTurn;
  align: "start" | "end";
}) {
  return (
    <Collapsible
      className={cn(
        "flex w-full flex-col",
        align === "end" ? "items-end" : "items-start",
      )}
    >
      <CollapsibleTrigger className="group/turn inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50">
        <ChevronRightIcon
          aria-hidden
          className="size-3 transition-transform group-data-panel-open/turn:rotate-90"
        />
        How the agent handled this
      </CollapsibleTrigger>
      <CollapsibleContent className="w-full max-w-md animate-enter motion-reduce:animate-none">
        <div className="mt-1.5 rounded-lg bg-muted/60 p-3 text-xs ring-1 ring-foreground/5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            <dt className="text-muted-foreground">Classified as</dt>
            <dd>{classificationLabel(turn.classification)}</dd>
            <dt className="text-muted-foreground">Outcome</dt>
            <dd>{outcomeLabel(turn.outcome)}</dd>
          </dl>

          {turn.chunks.length > 0 ? (
            <div className="mt-3">
              <p className="text-muted-foreground">Retrieved matches</p>
              <ul className="mt-1.5 flex flex-col gap-2">
                {turn.chunks.map((chunk) => (
                  <li key={chunk.chunkId} className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="min-w-0 flex-1 truncate">
                        {chunk.sourceName}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {chunk.used ? "Used" : "Below threshold"}
                      </span>
                      <span className="w-8 shrink-0 text-right tabular-nums">
                        {chunk.score.toFixed(2)}
                      </span>
                    </div>
                    <div
                      aria-hidden
                      className="h-1 overflow-hidden rounded-full bg-foreground/10"
                    >
                      <div
                        className={cn(
                          "h-full rounded-full",
                          chunk.used ? "bg-foreground/70" : "bg-foreground/25",
                        )}
                        style={{ width: `${Math.round(chunk.score * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="mt-3 text-muted-foreground">
            {(turn.model
              ? [
                  turn.model,
                  formatLatency(turn.latencyMs),
                  `${numberFormat.format(turn.tokensIn)} tokens in, ${numberFormat.format(turn.tokensOut)} out`,
                ]
              : [
                  "No match cleared the threshold, so the answer model wasn't called",
                  formatLatency(turn.latencyMs),
                ]
            ).join(" · ")}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
