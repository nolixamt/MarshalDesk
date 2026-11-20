import { db } from "./prisma/db";

export type VisitorDetailsInput = {
  country: string | null;
  city: string | null;
  timezone: string | null;
  language: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  page: string | null;
  referrer: string | null;
};

export type VisitorRow = VisitorDetailsInput & {
  id: string;
  workspaceId: string;
  vskHash: string;
  visitCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
};

// A widget start after this much quiet time counts as a new visit.
const NEW_VISIT_AFTER_MS = 30 * 60 * 1000;

export async function findVisitor(
  workspaceId: string,
  visitorId: string,
): Promise<VisitorRow | null> {
  const row = await db.orm.public.Visitor.where({
    id: visitorId,
    workspaceId,
  }).first();
  return row ?? null;
}

export async function createVisitor(
  workspaceId: string,
  input: { vskHash: string; details: VisitorDetailsInput },
): Promise<VisitorRow> {
  return db.orm.public.Visitor.create({
    workspaceId,
    vskHash: input.vskHash,
    ...input.details,
  });
}

/**
 * Records a returning visitor. Location is only replaced when this request has one, so local
 * development (no geolocation headers) doesn't erase what production recorded.
 */
export async function touchVisitor(
  workspaceId: string,
  visitorId: string,
  details: VisitorDetailsInput,
): Promise<VisitorRow | null> {
  const current = await findVisitor(workspaceId, visitorId);
  if (!current) return null;
  const now = new Date();
  const newVisit =
    now.getTime() - current.lastSeenAt.getTime() > NEW_VISIT_AFTER_MS;
  const row = await db.orm.public.Visitor.where({
    id: visitorId,
    workspaceId,
  }).update({
    country: details.country ?? current.country,
    city: details.country ? details.city : current.city,
    timezone: details.timezone ?? current.timezone,
    language: details.language ?? current.language,
    device: details.device ?? current.device,
    browser: details.browser ?? current.browser,
    os: details.os ?? current.os,
    page: details.page ?? current.page,
    referrer: newVisit ? details.referrer : current.referrer,
    visitCount: newVisit ? current.visitCount + 1 : current.visitCount,
    lastSeenAt: now,
  });
  return row ?? null;
}

/** First widget session from a real (non-development) allowed domain marks the snippet installed. */
export async function markSnippetInstalled(workspaceId: string) {
  await db.orm.public.Workspace.where({ id: workspaceId })
    .where((w) => w.snippetInstalledAt.isNull())
    .updateAndCount({ snippetInstalledAt: new Date() });
}

/** Only the fields the proxy and visitor checks need. */
export async function getWidgetAccess(
  workspaceId: string,
): Promise<{ allowedDomains: readonly string[] } | null> {
  const row = await db.orm.public.Workspace.where({ id: workspaceId })
    .select("allowedDomains")
    .first();
  return row ?? null;
}
