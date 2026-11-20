import type { Conversation } from "@marshaldesk/shared";

export type InboxFilter = "open" | "waiting" | "ai" | "human" | "closed";

export const inboxFilters: { value: InboxFilter; label: string }[] = [
  { value: "open", label: "All open" },
  { value: "waiting", label: "Waiting" },
  { value: "ai", label: "Agent" },
  { value: "human", label: "You" },
  { value: "closed", label: "Closed" },
];

export function matchesFilter(
  conversation: Conversation,
  filter: InboxFilter,
): boolean {
  switch (filter) {
    case "open":
      return conversation.state !== "closed";
    case "waiting":
    case "ai":
    case "human":
    case "closed":
      return conversation.state === filter;
    default: {
      const unhandled: never = filter;
      return unhandled;
    }
  }
}
