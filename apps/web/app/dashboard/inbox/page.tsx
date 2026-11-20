import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { Inbox } from "@/components/inbox/inbox";
import { InboxSkeleton } from "@/components/inbox/inbox-skeleton";

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
  const { now, initialSelectedId } = await readRequest(searchParams);
  return <Inbox now={now} initialSelectedId={initialSelectedId} />;
}

// The mock inbox is built relative to this request's time, which the client reuses for hydration.
async function readRequest(
  searchParams: PageProps<"/dashboard/inbox">["searchParams"],
) {
  await connection();
  const { c } = await searchParams;
  return {
    now: Date.now(),
    initialSelectedId: typeof c === "string" ? c : null,
  };
}
