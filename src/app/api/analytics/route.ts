import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase, databaseConfigured } from "@/lib/db/connect";
import { ANALYTICS_EVENTS, AnalyticsEvent } from "@/lib/db/models";
import { getClientCountry } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

const eventNames = new Set<string>(ANALYTICS_EVENTS);

/**
 * A type guard rather than a bare `Set.has`.
 *
 * `has` returns a boolean and leaves the value typed as `string`, so the
 * checked name still would not satisfy the model's literal union at the call
 * site. Narrowing here means the validation and the type agree, instead of the
 * type being asserted away somewhere the check is no longer visible.
 */
function isEventName(value: string): value is AnalyticsEventName {
  return eventNames.has(value);
}
const idShape = /^[a-zA-Z0-9_-]{8,64}$/;
const globalRate = globalThis as typeof globalThis & {
  _analyticsRate?: Map<string, { count: number; resetAt: number }>;
};
const rate = globalRate._analyticsRate ?? (globalRate._analyticsRate = new Map());
const MAX_RATE_KEYS = 10_000;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const current = rate.get(key);
  if (!current || current.resetAt <= now) {
    if (rate.size >= MAX_RATE_KEYS && !rate.has(key)) {
      // Map preserves insertion order. Evict the oldest bucket in O(1) so an
      // attacker rotating IPs cannot grow server memory without bound.
      const oldest = rate.keys().next().value;
      if (oldest !== undefined) rate.delete(oldest);
    }
    rate.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 180;
}

const TOO_LARGE = Symbol("too-large");

async function readBody(request: NextRequest): Promise<Record<string, unknown> | null | typeof TOO_LARGE> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 16_384) {
      await reader.cancel();
      return TOO_LARGE;
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();

  try {
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function clean(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : null;
}

function cleanPath(value: unknown, max: number): string | null {
  const text = clean(value, max * 2);
  if (!text || !text.startsWith("/")) return null;
  return text.split(/[?#]/, 1)[0].slice(0, max);
}

function cleanUrl(value: unknown, max: number): string | null {
  const text = clean(value, max * 2);
  if (!text) return null;
  try {
    const url = new URL(text, "https://beayano.invalid");
    const normalized = url.origin === "https://beayano.invalid"
      ? url.pathname
      : `${url.origin}${url.pathname === "/" ? "" : url.pathname}`;
    return normalized.slice(0, max);
  } catch {
    return null;
  }
}

function deviceFor(ua: string): "mobile" | "tablet" | "desktop" | "unknown" {
  if (!ua) return "unknown";
  if (/ipad|tablet|kindle/i.test(ua)) return "tablet";
  if (/mobile|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

function browserFor(ua: string): string | null {
  if (/edg\//i.test(ua)) return "Edge";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/chrome\//i.test(ua)) return "Chrome";
  if (/safari\//i.test(ua)) return "Safari";
  return ua ? "Other" : null;
}

function safeMetadata(event: AnalyticsEventName, value: unknown): Record<string, boolean> | null {
  if (event !== "page.leave" || !value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const engaged = (value as Record<string, unknown>).engaged;
  return typeof engaged === "boolean" ? { engaged } : null;
}

export async function POST(request: NextRequest) {
  if (!databaseConfigured()) return new NextResponse(null, { status: 204 });

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  if (rateLimited(forwarded || "unknown")) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await readBody(request);
  if (body === TOO_LARGE) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }
  const event = clean(body?.event, 60);
  const visitorId = clean(body?.visitorId, 64);
  const sessionId = clean(body?.sessionId, 64);
  const path = cleanPath(body?.path, 500);
  if (!event || !isEventName(event) || !visitorId || !sessionId || !path ||
      !idShape.test(visitorId) || !idShape.test(sessionId) || !path.startsWith("/")) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const user = await getCurrentUser();
    const ua = request.headers.get("user-agent") ?? "";
    const ipSalt = process.env.ANALYTICS_SALT;
    const ipHash = forwarded && ipSalt
      ? createHash("sha256").update(`${ipSalt}:${forwarded}`).digest("hex").slice(0, 32)
      : null;
    const numeric = (value: unknown, max: number) =>
      typeof value === "number" && Number.isFinite(value)
        ? Math.max(0, Math.min(max, value))
        : null;

    await AnalyticsEvent.create({
      event,
      visitorId,
      sessionId,
      user: user?.id ?? null,
      path,
      title: clean(body?.title, 300),
      referrer: cleanUrl(body?.referrer, 1000),
      source: clean(body?.source, 120),
      medium: clean(body?.medium, 120),
      campaign: clean(body?.campaign, 120),
      country: getClientCountry(request),
      device: deviceFor(ua),
      browser: browserFor(ua),
      ipHash,
      durationMs: numeric(body?.durationMs, 86_400_000),
      value: numeric(body?.value, 10_000_000),
      label: clean(body?.label, 240),
      target: cleanUrl(body?.target, 1000),
      metadata: safeMetadata(event, body?.metadata),
    });
  } catch (error) {
    console.error("[analytics] event write failed:", error);
    return NextResponse.json({ error: "analytics_unavailable" }, { status: 503 });
  }

  return new NextResponse(null, { status: 204 });
}
