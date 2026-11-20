"use client";

import type { Message } from "@marshaldesk/shared";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { AgentTurnDetails } from "./agent-turn-details";
import { timeAgo } from "./labels";

export type Participant = { name: string; avatarUrl: string };

export function MessageItem({
  message,
  agent,
  owner,
  arrived,
  now,
}: {
  message: Message;
  agent: Participant;
  owner: Participant;
  arrived: boolean;
  now: number;
}) {
  const enter = arrived
    ? "animate-enter motion-reduce:animate-none"
    : undefined;
  const time = timeAgo(message.createdAt, now);

  switch (message.author) {
    case "system":
      return (
        <p
          className={cn(
            "mx-auto max-w-md px-4 text-center text-xs text-muted-foreground",
            enter,
          )}
        >
          {message.body}
        </p>
      );
    case "visitor":
      return (
        <div className={cn("flex flex-col items-start gap-1", enter)}>
          <div className="max-w-[min(36rem,85%)] rounded-xl bg-muted px-3.5 py-2.5 text-sm break-words whitespace-pre-wrap">
            {message.body}
          </div>
          <p className="px-1 text-xs text-muted-foreground">
            {message.declined ? "Declined · off-topic · " : null}
            {time}
          </p>
          {message.agentTurn ? (
            <AgentTurnDetails turn={message.agentTurn} align="start" />
          ) : null}
        </div>
      );
    case "agent":
      return (
        <div className={cn("flex flex-col items-end gap-1", enter)}>
          <Author participant={agent} time={time} />
          <div className="max-w-[min(36rem,85%)] rounded-xl border border-primary/45 bg-primary/8 px-3.5 py-2.5 text-sm break-words whitespace-pre-wrap">
            {message.body}
          </div>
          {message.sourceNames.length > 0 ? (
            <SourceTags names={message.sourceNames} />
          ) : null}
        </div>
      );
    case "member":
      return (
        <div className={cn("flex flex-col items-end gap-1", enter)}>
          <Author
            participant={{
              name: message.memberName ?? owner.name,
              avatarUrl: owner.avatarUrl,
            }}
            time={time}
          />
          <div className="max-w-[min(36rem,85%)] rounded-xl bg-primary px-3.5 py-2.5 text-sm break-words whitespace-pre-wrap text-primary-foreground">
            {message.body}
          </div>
        </div>
      );
    default: {
      const unhandled: never = message.author;
      return unhandled;
    }
  }
}

function Author({
  participant,
  time,
}: {
  participant: Participant;
  time: string;
}) {
  return (
    <div className="flex items-center gap-2 px-1 text-xs">
      <span className="text-muted-foreground">{time}</span>
      <span className="font-medium">{participant.name}</span>
      <Avatar className="size-5 bg-white">
        <AvatarImage src={participant.avatarUrl} alt="" />
        <AvatarFallback />
      </Avatar>
    </div>
  );
}

function SourceTags({ names }: { names: string[] }) {
  return (
    <div className="flex max-w-[min(36rem,85%)] flex-wrap items-center justify-end gap-1.5 px-1">
      <span className="text-xs text-muted-foreground">Answered from</span>
      {names.map((name) => (
        <Tooltip key={name}>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-disabled="true"
                onClick={(event) => event.preventDefault()}
                className="inline-flex h-5 max-w-56 cursor-default items-center truncate rounded-md bg-muted px-1.5 text-xs text-muted-foreground ring-1 ring-foreground/10 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            }
          >
            {name}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="data-instant:animate-none">
            Chunk viewer comes with the knowledge base
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
