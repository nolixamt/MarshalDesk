import type { Conversation } from "@marshaldesk/shared";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { visitorAvatarUrl } from "@/lib/avatars";

import {
  handoffReasonLabel,
  languageName,
  localTime,
  stateDescription,
  timeAgo,
  visitorName,
} from "./labels";

function displayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  } catch {
    return url;
  }
}

type Row = { label: string; value: string };

function DetailRows({ rows }: { rows: Row[] }) {
  return (
    <dl className="divide-y divide-foreground/10">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-col gap-0.5 px-4 py-2.5 text-sm @[17rem]:flex-row @[17rem]:gap-3"
        >
          <dt className="shrink-0 text-muted-foreground @[17rem]:w-24">
            {row.label}
          </dt>
          <dd className="min-w-0 flex-1 break-words">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function VisitorDetails({
  conversation,
  now,
}: {
  conversation: Conversation;
  now: number;
}) {
  const { visitor } = conversation;
  const d = visitor.details;
  const unknown = "Unknown";

  const location = [d.city, d.country].filter(Boolean).join(", ") || unknown;
  const time = d.timezone ? localTime(d.timezone, now) : null;
  const device = [d.device, d.browser, d.os].filter(Boolean).join(" · ");

  const visitorRows: Row[] = [
    { label: "Location", value: location },
    {
      label: "Local time",
      value: time && d.timezone ? `${time} (${d.timezone})` : unknown,
    },
    {
      label: "Language",
      value: d.language ? languageName(d.language) : unknown,
    },
    { label: "Device", value: device || unknown },
    { label: "Current page", value: d.page ? displayUrl(d.page) : unknown },
    {
      label: "Came from",
      value: d.referrer ? displayUrl(d.referrer) : "Direct",
    },
    { label: "Visits", value: String(d.visitCount) },
    { label: "First seen", value: timeAgo(visitor.firstSeenAt, now) },
    { label: "Last seen", value: timeAgo(visitor.lastSeenAt, now) },
  ];

  const conversationRows: Row[] = [
    { label: "State", value: stateDescription(conversation.state) },
    { label: "Started", value: timeAgo(conversation.createdAt, now) },
    ...(conversation.handoffReason
      ? [
          {
            label: "Handoff",
            value: handoffReasonLabel(conversation.handoffReason),
          },
        ]
      : []),
    ...(conversation.closedAt
      ? [{ label: "Closed", value: timeAgo(conversation.closedAt, now) }]
      : []),
  ];

  return (
    <aside
      aria-label="Visitor details"
      className="@container flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex items-center gap-3 border-b border-foreground/10 px-4 py-4">
          <Avatar className="size-10">
            <AvatarImage src={visitorAvatarUrl(visitor.id)} alt="" />
            <AvatarFallback />
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {visitorName(visitor)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              First seen {timeAgo(visitor.firstSeenAt, now).toLowerCase()}
            </p>
          </div>
        </div>
        <DetailRows rows={visitorRows} />
        <h3 className="border-y border-foreground/10 px-4 pt-4 pb-2 text-sm font-semibold">
          Conversation
        </h3>
        <DetailRows rows={conversationRows} />
      </ScrollArea>
    </aside>
  );
}
