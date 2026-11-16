import type { Metadata } from "next";

export const metadata: Metadata = { title: "Home · MarshalDesk" };

export default function DashboardHomePage() {
  return (
    <div className="px-4 py-6 lg:px-6 lg:py-8">
      <h1 className="text-2xl font-semibold tracking-[-0.03em]">Home</h1>
      <p className="mt-1 text-muted-foreground">
        Your workspace at a glance. More is coming soon.
      </p>
    </div>
  );
}
