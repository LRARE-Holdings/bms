/** The public site's origin, e.g. https://burnmatstudio.co.uk — for share links and metadata. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://burnmatstudio.co.uk").replace(/\/$/, "");
}

/**
 * A `next` query value is only honoured when it is a path on this site.
 * Anything else ("https://evil.example", "//evil.example") becomes the fallback,
 * so a crafted login link cannot bounce someone to another site.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
