"use client";

import {
  accentColors,
  type WidgetConfig,
  type WidgetThread,
} from "@marshaldesk/shared";
import { ORPCError } from "@orpc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "cn";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { WidgetLauncher } from "@/components/widget/widget-launcher";
import { WidgetMessage } from "@/components/widget/widget-message";
import { WidgetPanel } from "@/components/widget/widget-panel";
import { WidgetSuggestedQuestions } from "@/components/widget/widget-suggested-questions";
import { WidgetTypingIndicator } from "@/components/widget/widget-typing-indicator";
import {
  resolveAgentAvatarUrl,
  WidgetTheme,
} from "@/components/widget/widget-theme";
import {
  startVisitorSession,
  widgetClient,
  widgetOrpc,
  withVisitor,
} from "@/lib/widget/client";
import {
  latestMemberMessage,
  mergeIntoThread,
  widgetStatus,
} from "@/lib/widget/thread";

import { useConversationRoom } from "./use-conversation-room";
import { useEmbedBridge } from "./use-embed-bridge";
import { memberAuthor, WidgetThreadMessage } from "./widget-thread-message";

const threadKey = widgetOrpc.widget.getThread.queryKey();

type PendingMessage = {
  localId: string;
  body: string;
  status: "sending" | "failed";
};

function launcherCornerClassName(position: WidgetConfig["position"]): string {
  switch (position) {
    case "bottom-left":
      return "left-5";
    case "bottom-right":
      return "right-5";
    default: {
      const unreachable: never = position;
      return unreachable;
    }
  }
}

function readTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

export function WidgetApp({
  config: initialConfig,
  host,
}: {
  config: WidgetConfig;
  host: string;
}) {
  const { page, mobile, postLayout } = useEmbedBridge(host);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [initialIds, setInitialIds] = useState<ReadonlySet<string> | null>(
    null,
  );
  const sendQueue = useRef<Promise<void>>(Promise.resolve());
  const bodyRef = useRef<HTMLDivElement>(null);

  const session = useQuery({
    queryKey: ["widget-session", initialConfig.workspaceId, host],
    queryFn: () =>
      startVisitorSession({
        workspaceId: initialConfig.workspaceId,
        host,
        details: {
          timezone: readTimezone(),
          language: navigator.language || null,
          page: page?.page ?? null,
          referrer: page?.referrer ?? null,
        },
      }),
    enabled: page !== null,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) =>
      !(error instanceof ORPCError && error.defined) && failureCount < 3,
  });
  const started = session.isSuccess;
  const config = session.data?.config ?? initialConfig;

  const thread = useQuery({
    queryKey: threadKey,
    queryFn: () => withVisitor(() => widgetClient.widget.getThread()),
    enabled: started,
  });

  const conversationId = thread.data?.conversation?.id ?? null;
  const room = useConversationRoom({
    conversationId,
    enabled: started,
    threadKey,
  });
  const { stopTyping } = room;

  useEffect(() => {
    if (!open) stopTyping();
  }, [open, stopTyping]);

  const layoutState = !started ? "hidden" : open ? "open" : "collapsed";
  useEffect(() => {
    postLayout(layoutState, config.position);
  }, [postLayout, layoutState, config.position]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const messages = thread.data?.messages ?? [];
  const conversation = thread.data?.conversation ?? null;

  // Only messages that arrive after the thread first loaded animate in.
  if (initialIds === null && thread.data) {
    setInitialIds(new Set(thread.data.messages.map((message) => message.id)));
  }

  const lastKey = `${messages.at(-1)?.id ?? ""}:${pending.length}:${room.memberTyping}`;
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (open && body) body.scrollTop = body.scrollHeight;
  }, [open, lastKey]);

  const deliver = useCallback(
    (item: PendingMessage) => {
      sendQueue.current = sendQueue.current.then(async () => {
        setPending((current) =>
          current.map((entry) =>
            entry.localId === item.localId
              ? { ...entry, status: "sending" }
              : entry,
          ),
        );
        try {
          const result = await withVisitor(() =>
            widgetClient.widget.sendMessage({ body: item.body }),
          );
          // A fetch that started before the send would overwrite the merged thread.
          const fetching = queryClient.isFetching({ queryKey: threadKey }) > 0;
          if (fetching)
            await queryClient.cancelQueries({ queryKey: threadKey });
          queryClient.setQueryData<WidgetThread>(threadKey, (current) =>
            mergeIntoThread(current, result.conversation, result.messages),
          );
          if (fetching) {
            void queryClient.invalidateQueries({ queryKey: threadKey });
          }
          setPending((current) =>
            current.filter((entry) => entry.localId !== item.localId),
          );
        } catch {
          setPending((current) =>
            current.map((entry) =>
              entry.localId === item.localId
                ? { ...entry, status: "failed" }
                : entry,
            ),
          );
        }
      });
    },
    [queryClient],
  );

  function send(text: string) {
    const body = text.trim();
    if (!body) return;
    stopTyping();
    const item: PendingMessage = {
      localId: crypto.randomUUID(),
      body,
      status: "sending",
    };
    setPending((current) => [...current, item]);
    deliver(item);
  }

  function requestHuman() {
    void withVisitor(() => widgetClient.widget.requestHuman())
      .catch(() => null)
      .then(() => queryClient.invalidateQueries({ queryKey: threadKey }));
  }

  if (layoutState === "hidden") return null;

  const accent = accentColors[config.color];
  const agent = {
    role: "agent",
    name: config.agentName,
    avatarUrl: resolveAgentAvatarUrl(
      config.agentName,
      config.agentAvatarUrl,
      accent,
    ),
  } as const;
  const startsNewConversation =
    conversation === null || conversation.state === "closed";
  const showDraftGreeting =
    messages.length === 0 || (startsNewConversation && pending.length > 0);
  const hasVisitorMessage =
    pending.length > 0 ||
    messages.some((message) => message.author === "visitor");
  const showSuggestedQuestions = config.agentOn && !hasVisitorMessage;
  const canAskForHuman =
    config.agentOn &&
    conversation?.state !== "waiting" &&
    conversation?.state !== "human";
  const fullScreen = open && mobile;

  return (
    <WidgetTheme accent={accent} className="fixed inset-0">
      {open && (
        <WidgetPanel
          className={cn(
            "absolute",
            fullScreen
              ? "inset-0 h-dvh rounded-none shadow-none ring-0"
              : "inset-x-5 top-5 bottom-20 animate-enter motion-reduce:animate-none",
          )}
          agentName={config.agentName}
          avatarUrl={agent.avatarUrl}
          status={widgetStatus(thread.data)}
          agentOn={canAskForHuman}
          draft={draft}
          onDraftChange={(value) => {
            setDraft(value);
            room.onDraftChange(value);
          }}
          onDraftBlur={stopTyping}
          onSend={() => {
            send(draft);
            setDraft("");
          }}
          onTalkToHuman={requestHuman}
          onClose={() => setOpen(false)}
          autoFocus={!mobile}
          bodyRef={bodyRef}
        >
          {messages.map((message) => (
            <WidgetThreadMessage
              key={message.id}
              message={message}
              agent={agent}
              animate={
                initialIds !== null &&
                !initialIds.has(message.id) &&
                message.author !== "visitor"
              }
            />
          ))}
          {showDraftGreeting && (
            <WidgetMessage author={agent}>{config.greeting}</WidgetMessage>
          )}
          {showSuggestedQuestions && (
            <WidgetSuggestedQuestions
              questions={config.suggestedQuestions}
              onSelect={send}
            />
          )}
          {room.memberTyping && conversation && (
            <WidgetTypingIndicator
              author={memberAuthor(
                latestMemberMessage(conversation.id, messages),
              )}
            />
          )}
          {pending.map((item) => (
            <WidgetMessage
              key={item.localId}
              author={{ role: "visitor" }}
              delivery={item.status}
              onRetry={() => deliver(item)}
            >
              {item.body}
            </WidgetMessage>
          ))}
        </WidgetPanel>
      )}
      {!fullScreen && (
        <div
          className={cn(
            "absolute bottom-5",
            launcherCornerClassName(config.position),
          )}
        >
          <WidgetLauncher open={open} onToggle={() => setOpen((on) => !on)} />
        </div>
      )}
    </WidgetTheme>
  );
}
