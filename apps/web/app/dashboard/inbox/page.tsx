import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { matchesFilter } from "@/components/inbox/filters";
import { Inbox } from "@/components/inbox/inbox";
import { InboxSkeleton } from "@/components/inbox/inbox-skeleton";
import { sortConversations } from "@/components/inbox/labels";
import { orpc } from "@/lib/orpc/client";
import { makeQueryClient } from "@/lib/query-client";

export const metadata: Metadata = { title: "Inbox · MarshalDesk" };

export default function InboxPage({
  searchParams,
}: PageProps<"/dashboard/inbox">) {
  return (
    <Suspense fallback={<InboxSkeleton />}>
      <InboxLoader searchParams={searchParams} />
    </Suspense>
  );
}

async function InboxLoader({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard/inbox">["searchParams"];
}) {
  const { queryClient, now, selectedId } = await loadInbox(searchParams);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Inbox now={now} initialSelectedId={selectedId} />
    </HydrationBoundary>
  );
}

async function loadInbox(
  searchParams: PageProps<"/dashboard/inbox">["searchParams"],
) {
  await connection();
  const { c } = await searchParams;

  const queryClient = makeQueryClient();
  const conversations = await queryClient.fetchQuery(
    orpc.inbox.list.queryOptions(),
  );
  const selected =
    conversations.find((conversation) => conversation.id === c) ??
    sortConversations(
      conversations.filter((conversation) =>
        matchesFilter(conversation, "open"),
      ),
    )[0];
  if (selected) {
    await queryClient.prefetchQuery(
      orpc.inbox.get.queryOptions({ input: { id: selected.id } }),
    );
  }

  // Relative times render from this request's time, which the client reuses for hydration.
  return { queryClient, now: Date.now(), selectedId: selected?.id ?? null };
}
