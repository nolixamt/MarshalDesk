import type {
  Conversation,
  ConversationState,
  Message,
} from "@marshaldesk/shared";

import type { MockInbox } from "@/lib/mock/inbox";

export const HAND_BACK_NOTICE = "You're now chatting with the AI agent.";
export const CLOSED_NOTICE =
  "This conversation has ended. Send a message to start a new one.";

export type InboxState = MockInbox & {
  selectedId: string | null;
  // Messages created while the page is open; only these animate in.
  arrivedIds: ReadonlySet<string>;
};

type TransitionEvent = "take_over" | "reply" | "hand_back" | "close";

export type InboxAction =
  | { type: "select"; conversationId: string }
  | { type: "take_over"; conversationId: string }
  | { type: "hand_back"; conversationId: string; messageId: string; at: string }
  | { type: "close"; conversationId: string; messageId: string; at: string }
  | {
      type: "reply";
      conversationId: string;
      messageId: string;
      at: string;
      body: string;
    };

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

function systemMessage(
  conversationId: string,
  id: string,
  body: string,
  at: string,
): Message {
  return {
    id,
    conversationId,
    author: "system",
    memberName: null,
    body,
    classification: null,
    declined: false,
    sourceNames: [],
    agentTurn: null,
    createdAt: at,
  };
}

function updateConversation(
  state: InboxState,
  conversationId: string,
  update: (conversation: Conversation) => Conversation,
): Conversation[] {
  return state.conversations.map((c) =>
    c.id === conversationId ? update(c) : c,
  );
}

function appendMessage(state: InboxState, message: Message): InboxState {
  return {
    ...state,
    messages: {
      ...state.messages,
      [message.conversationId]: [
        ...(state.messages[message.conversationId] ?? []),
        message,
      ],
    },
    arrivedIds: new Set([...state.arrivedIds, message.id]),
  };
}

export function inboxReducer(
  state: InboxState,
  action: InboxAction,
): InboxState {
  const current = state.conversations.find(
    (c) => c.id === action.conversationId,
  );
  if (!current) return state;

  switch (action.type) {
    case "select":
      return {
        ...state,
        selectedId: action.conversationId,
        conversations: updateConversation(state, action.conversationId, (c) =>
          c.unread ? { ...c, unread: false } : c,
        ),
      };
    case "take_over": {
      const next = transition(current.state, "take_over");
      if (!next) return state;
      return {
        ...state,
        conversations: updateConversation(
          state,
          action.conversationId,
          (c) => ({
            ...c,
            state: next,
          }),
        ),
      };
    }
    case "hand_back": {
      const next = transition(current.state, "hand_back");
      if (!next) return state;
      const withNotice = appendMessage(
        state,
        systemMessage(
          action.conversationId,
          action.messageId,
          HAND_BACK_NOTICE,
          action.at,
        ),
      );
      return {
        ...withNotice,
        conversations: updateConversation(
          state,
          action.conversationId,
          (c) => ({
            ...c,
            state: next,
            handoffReason: null,
          }),
        ),
      };
    }
    case "close": {
      const next = transition(current.state, "close");
      if (!next) return state;
      const withNotice = appendMessage(
        state,
        systemMessage(
          action.conversationId,
          action.messageId,
          CLOSED_NOTICE,
          action.at,
        ),
      );
      return {
        ...withNotice,
        conversations: updateConversation(
          state,
          action.conversationId,
          (c) => ({
            ...c,
            state: next,
            closedAt: action.at,
          }),
        ),
      };
    }
    case "reply": {
      const next = transition(current.state, "reply");
      if (!next) return state;
      const withReply = appendMessage(state, {
        id: action.messageId,
        conversationId: action.conversationId,
        author: "member",
        memberName: null,
        body: action.body,
        classification: null,
        declined: false,
        sourceNames: [],
        agentTurn: null,
        createdAt: action.at,
      });
      return {
        ...withReply,
        conversations: updateConversation(
          state,
          action.conversationId,
          (c) => ({
            ...c,
            state: next,
            lastMessagePreview: action.body,
            lastMessageAt: action.at,
          }),
        ),
      };
    }
    default: {
      const unhandled: never = action;
      return unhandled;
    }
  }
}
