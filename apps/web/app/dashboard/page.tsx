import type { Metadata } from "next";

import { AgentSection } from "@/components/widget-settings/agent-section";
import { AllowedDomainsSection } from "@/components/widget-settings/allowed-domains-section";
import { AppearanceSection } from "@/components/widget-settings/appearance-section";
import { KnowledgeSection } from "@/components/widget-settings/knowledge-section";
import { InstallSection } from "@/components/widget-settings/install-section";
import { SetupProgress } from "@/components/widget-settings/setup-progress";
import { WidgetPreview } from "@/components/widget-settings/widget-preview";

export const metadata: Metadata = { title: "Home · MarshalDesk" };

export default function DashboardHomePage() {
  return (
    <div className="@container/page px-4 py-6 lg:px-6 lg:py-8">
      <h1 className="text-2xl font-semibold tracking-[-0.03em]">Your widget</h1>
      <p className="mt-1 text-muted-foreground">
        Set up how your widget looks and where it runs. Changes apply right
        away.
      </p>
      <div className="mt-8 grid gap-8 @5xl/page:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <SetupProgress />
          <AppearanceSection />
          <AgentSection />
          <KnowledgeSection />
          <AllowedDomainsSection />
          <InstallSection />
        </div>
        <aside
          aria-label="Widget preview"
          className="@5xl/page:sticky @5xl/page:top-6 @5xl/page:self-start"
        >
          <WidgetPreview />
        </aside>
      </div>
    </div>
  );
}
