import type { ConversationState } from "@marshaldesk/shared";

type TransitionEvent = "take_over" | "reply" | "hand_back" | "close";

// Flow C (PRD section 6). Returns null when the event isn't allowed in that state.
export function transition(
  state: ConversationState,
  event: TransitionEvent,
): ConversationState | null {
  switch (state) {
    case "ai":
    case "waiting":
      switch (event) {
        case "take_over":
        case "reply":
          return "human";
        case "close":
          return "closed";
        case "hand_back":
          return null;
        default: {
          const unhandled: never = event;
          return unhandled;
        }
      }
    case "human":
      switch (event) {
        case "reply":
          return "human";
        case "hand_back":
          return "ai";
        case "close":
          return "closed";
        case "take_over":
          return null;
        default: {
          const unhandled: never = event;
          return unhandled;
        }
      }
    case "closed":
      return null;
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

export function canTransition(
  state: ConversationState,
  event: TransitionEvent,
): boolean {
  return transition(state, event) !== null;
}
