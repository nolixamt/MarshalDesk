import { ORPCError, safe } from "@orpc/client";
import type { Metadata } from "next";
import { connection } from "next/server";

import { WidgetApp } from "@/components/widget-app/widget-app";
import { client } from "@/lib/orpc/client";

export const metadata: Metadata = {
  title: "Chat",
  robots: { index: false, follow: false },
};

// Blocking on purpose: the loader keeps the iframe display:none until the widget starts, and
// browsers don't run animation frames there, which React needs to reveal a streamed Suspense
// boundary. Rendering the whole page in one response lets it hydrate while hidden.
export const instant = false;

// The iframe sits on the customer's page, so everything outside the widget must stay see-through.
// The dev overlay badge would sit on top of the launcher inside the small iframe.
const transparentPage =
  "html,body{background:transparent!important;color-scheme:light}nextjs-portal{display:none}";

export default function WidgetPage({
  params,
  searchParams,
}: PageProps<"/widget/[workspaceId]">) {
  return (
    <>
      <style>{transparentPage}</style>
      <WidgetLoader params={params} searchParams={searchParams} />
    </>
  );
}

async function WidgetLoader({
  params,
  searchParams,
}: {
  params: PageProps<"/widget/[workspaceId]">["params"];
  searchParams: PageProps<"/widget/[workspaceId]">["searchParams"];
}) {
  // Prisma generates ids while querying, which can't happen during prerendering.
  await connection();
  const [{ workspaceId }, { host }] = await Promise.all([params, searchParams]);
  if (typeof host !== "string" || host.length === 0) return null;

  const { error, data, definedError } = await safe(
    client.widget.getConfig({ workspaceId, host }),
  );
  if (definedError) return null;
  if (error) {
    // An invalid workspace id or host fails input validation; anything else is a real failure.
    if (error instanceof ORPCError && error.code === "BAD_REQUEST") return null;
    throw error;
  }
  return <WidgetApp config={data} host={host} />;
}
