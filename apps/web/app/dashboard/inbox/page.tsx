import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inbox · MarshalDesk" };

export default function InboxPage() {
  return (
    <div className="px-4 py-6 lg:px-6 lg:py-8">
      <h1 className="text-2xl font-semibold tracking-[-0.03em]">Inbox</h1>
      <p className="mt-1 text-muted-foreground">
        Conversations with visitors will show up here.
      </p>
    </div>
  );
}
