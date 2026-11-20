const DICEBEAR_BASE = "https://api.dicebear.com/10.x";

function diceBear(
  style: string,
  seed: string,
  params: Record<string, string> = {},
): string {
  const query = new URLSearchParams({ seed, ...params });
  return `${DICEBEAR_BASE}/${style}/svg?${query.toString()}`;
}

export function memberAvatarUrl(name: string): string {
  return diceBear("notionists-neutral", name);
}

export function agentAvatarUrl(agentName: string, accentHex: string): string {
  return diceBear("glass", agentName, {
    backgroundColor: accentHex.replace("#", ""),
  });
}

export function visitorAvatarUrl(visitorId: string): string {
  return diceBear("thumbs", visitorId);
}
