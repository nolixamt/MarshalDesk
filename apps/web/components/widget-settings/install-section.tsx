"use client";

import { CodeBlock } from "@/components/dashboard/code-block";
import { SettingsSection } from "@/components/dashboard/settings-section";
import { useWidgetSettings } from "@/components/dashboard/widget-settings-context";

function installSnippet(appUrl: string, workspaceId: string): string {
  return [
    "<script",
    `  src="${appUrl}/embed.js"`,
    `  data-workspace="${workspaceId}"`,
    "  async",
    "></script>",
  ].join("\n");
}

export function InstallSection() {
  const { workspaceId } = useWidgetSettings();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <SettingsSection
      id="install"
      title="Install"
      description="Add the widget to your website with one snippet."
    >
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm">
          Paste this just before the closing{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            &lt;/body&gt;
          </code>{" "}
          tag on every page where the widget should appear.
        </p>
        <CodeBlock
          code={installSnippet(appUrl, workspaceId)}
          label="Copy snippet"
        />
      </div>
    </SettingsSection>
  );
}
