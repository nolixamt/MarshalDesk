import "server-only";
import type { VisitorDetailsInput } from "@marshaldesk/db";
import type { WidgetBrowserDetails } from "@marshaldesk/shared";
import { geolocation } from "@vercel/functions";
import { UAParser } from "ua-parser-js";

function deviceLabel(type: string | undefined): string {
  switch (type) {
    case "mobile":
      return "Phone";
    case "tablet":
      return "Tablet";
    case undefined:
      return "Desktop";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

function versioned(name: string | undefined, version: string | undefined) {
  if (!name) return null;
  const major = version?.split(".")[0];
  return major ? `${name} ${major}` : name;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryName(code: string | undefined): string | null {
  if (!code) return null;
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

// Off Vercel the geo headers can be forged, and a malformed city fails to URI-decode.
function safeGeolocation(headers: Headers): ReturnType<typeof geolocation> {
  try {
    return geolocation({ headers });
  } catch {
    return {};
  }
}

/** Location comes from Vercel's geo headers (empty locally); the raw IP is never read or stored. */
export function visitorDetailsFrom(
  headers: Headers,
  browser: WidgetBrowserDetails,
): VisitorDetailsInput {
  const geo = safeGeolocation(headers);
  const ua = new UAParser(headers.get("user-agent") ?? "").getResult();
  return {
    country: countryName(geo.country),
    city: geo.city ?? null,
    timezone: browser.timezone,
    language: browser.language,
    device: deviceLabel(ua.device.type),
    browser: versioned(ua.browser.name, ua.browser.version),
    os: ua.os.name ?? null,
    page: browser.page,
    referrer: browser.referrer,
  };
}
