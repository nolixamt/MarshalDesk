// Outside production, localhost is allowed for every workspace without being stored, and it never
// marks the snippet installed (TECH-STACK section 6). Production never allows it implicitly.
const DEVELOPMENT_HOSTS = ["localhost"];

export function isDevelopmentHost(host: string): boolean {
  return (
    process.env.NODE_ENV !== "production" && DEVELOPMENT_HOSTS.includes(host)
  );
}

export function isHostAllowed(
  allowedDomains: readonly string[],
  host: string,
): boolean {
  return isDevelopmentHost(host) || allowedDomains.includes(host);
}

/** Origins for `frame-ancestors`: each allowed domain on any port, plus localhost in development. */
export function frameAncestorSources(
  allowedDomains: readonly string[],
): string[] {
  const hosts =
    process.env.NODE_ENV !== "production"
      ? [...allowedDomains, ...DEVELOPMENT_HOSTS]
      : [...allowedDomains];
  // A port wildcard also matches the scheme's default port.
  return hosts.flatMap((host) => [`http://${host}:*`, `https://${host}:*`]);
}
