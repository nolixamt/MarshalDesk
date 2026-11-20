import type { WidgetMessage as WidgetMessageData } from "@marshaldesk/shared";

import {
  WidgetMessage,
  WidgetNotice,
  type WidgetMessageAuthor,
} from "@/components/widget/widget-message";
import { memberAvatarUrl } from "@/lib/avatars";

const MEMBER_NAME_FALLBACK = "Support team";

function memberAuthor(message: WidgetMessageData): WidgetMessageAuthor {
  const name = message.memberName ?? MEMBER_NAME_FALLBACK;
  const generated = memberAvatarUrl(name);
  return {
    role: "member",
    name,
    avatarUrl: message.memberImageUrl ?? generated,
    fallbackAvatarUrl: generated,
  };
}

function SystemMessage({
  message,
  agent,
  className,
}: {
  message: WidgetMessageData;
  agent: WidgetMessageAuthor;
  className?: string;
}) {
  switch (message.systemNotice) {
    case "greeting":
      return (
        <WidgetMessage author={agent} className={className}>
          {message.body}
        </WidgetMessage>
      );
    case "agent_off":
    case "hand_back":
    case "closed":
    case null:
      return <WidgetNotice className={className}>{message.body}</WidgetNotice>;
    default: {
      const unreachable: never = message.systemNotice;
      return unreachable;
    }
  }
}

export function WidgetThreadMessage({
  message,
  agent,
  animate,
}: {
  message: WidgetMessageData;
  agent: WidgetMessageAuthor;
  animate: boolean;
}) {
  const className = animate
    ? "animate-enter motion-reduce:animate-none"
    : undefined;

  switch (message.author) {
    case "visitor":
      return (
        <WidgetMessage author={{ role: "visitor" }} className={className}>
          {message.body}
        </WidgetMessage>
      );
    case "agent":
      return (
        <WidgetMessage author={agent} className={className}>
          {message.body}
        </WidgetMessage>
      );
    case "member":
      return (
        <WidgetMessage author={memberAuthor(message)} className={className}>
          {message.body}
        </WidgetMessage>
      );
    case "system":
      return (
        <SystemMessage message={message} agent={agent} className={className} />
      );
    default: {
      const unreachable: never = message.author;
      return unreachable;
    }
  }
}
