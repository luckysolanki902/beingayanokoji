import type { NextRequest } from "next/server";

/**
 * The reader's country, as reported by Vercel's edge. This header is set by the
 * platform after the request leaves the browser, so unlike anything in the body
 * it cannot be forged by the client — which is why pricing keys off it.
 *
 * Returns null when we are not behind the edge (local dev, a self-hosted run).
 * Callers must treat null as "unknown", never as a particular country.
 */
export function getClientCountry(request: NextRequest): string | null {
  const raw =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    "";
  const code = raw.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

/** Best-effort client IP, for the record we keep of each support attempt. */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
