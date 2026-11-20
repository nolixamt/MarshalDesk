import type {
  AgentTurn,
  Classification,
  Conversation,
  ConversationState,
  HandoffReason,
  Visitor,
} from "@marshaldesk/shared";

export function stateLabel(state: ConversationState): string {
  switch (state) {
    case "ai":
      return "Agent";
    case "waiting":
      return "Waiting";
    case "human":
      return "You";
    case "closed":
      return "Closed";
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

export function stateDescription(state: ConversationState): string {
  switch (state) {
    case "ai":
      return "The agent is replying";
    case "waiting":
      return "Waiting for you";
    case "human":
      return "You're replying";
    case "closed":
      return "Closed";
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

export function handoffReasonLabel(reason: HandoffReason): string {
  switch (reason) {
    case "visitor_requested":
      return "Visitor asked for a person";
    case "no_relevant_knowledge":
      return "Agent couldn't find this in the knowledge base";
    case "low_confidence":
      return "Agent wasn't confident";
    case "agent_off":
      return "Agent is off";
    default: {
      const unhandled: never = reason;
      return unhandled;
    }
  }
}

export function classificationLabel(
  classification: Classification | null,
): string {
  if (classification === null) return "Not classified (image only)";
  switch (classification) {
    case "support_question":
      return "Support question";
    case "small_talk":
      return "Small talk";
    case "off_topic":
      return "Off-topic message";
    case "human_request":
      return "Request for a person";
    default: {
      const unhandled: never = classification;
      return unhandled;
    }
  }
}

export function outcomeLabel(outcome: AgentTurn["outcome"]): string {
  switch (outcome) {
    case "answered":
      return "Answered from the knowledge base";
    case "declined":
      return "Declined politely, without searching the knowledge base";
    case "small_talk":
      return "Replied briefly, without searching the knowledge base";
    case "handed_off":
      return "Handed the conversation to you";
    default: {
      const unhandled: never = outcome;
      return unhandled;
    }
  }
}

export function visitorName(visitor: Visitor): string {
  const { city, country } = visitor.details;
  const place = city ?? country;
  if (place) return `Visitor from ${place}`;
  // Visitor ids are UUIDv7, whose leading characters are a timestamp shared by nearby visitors.
  return `Visitor ${visitor.id.replaceAll("-", "").slice(-4)}`;
}

export function sortConversations(
  conversations: Conversation[],
): Conversation[] {
  return [...conversations].sort((a, b) => {
    const aWaiting = a.state === "waiting" ? 0 : 1;
    const bWaiting = b.state === "waiting" ? 0 : 1;
    if (aWaiting !== bWaiting) return aWaiting - bWaiting;
    return Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt);
  });
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function shortTimeAgo(iso: string, now: number): string {
  const diff = Math.max(now - Date.parse(iso), 0);
  if (diff < MINUTE) return "now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  return `${Math.floor(diff / DAY)}d`;
}

export function timeAgo(iso: string, now: number): string {
  const diff = Math.max(now - Date.parse(iso), 0);
  if (diff < MINUTE) return "Just now";
  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  if (diff < 2 * DAY) return "Yesterday";
  return `${Math.floor(diff / DAY)} days ago`;
}

export function localTime(timezone: string, now: number): string | null {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
    }).format(now);
  } catch {
    return null;
  }
}

export function languageName(tag: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(tag) ?? tag;
  } catch {
    return tag;
  }
}
