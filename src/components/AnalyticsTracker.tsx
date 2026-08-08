"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const VISITOR_KEY = "ba.analytics.visitor";
const SESSION_KEY = "ba.analytics.session";
const SESSION_AT_KEY = "ba.analytics.sessionAt";
const SESSION_MS = 30 * 60 * 1000;

type EventPayload = {
  event: string;
  value?: number;
  durationMs?: number;
  label?: string;
  target?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

function id(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function identity() {
  let visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = id();
    localStorage.setItem(VISITOR_KEY, visitorId);
  }
  const now = Date.now();
  const last = Number(localStorage.getItem(SESSION_AT_KEY) || 0);
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId || now - last > SESSION_MS) {
    sessionId = id();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  localStorage.setItem(SESSION_AT_KEY, String(now));
  return { visitorId, sessionId };
}

function campaignValue(url: URL, key: string): string | null {
  const value = url.searchParams.get(key)?.trim();
  return value && /^[a-zA-Z0-9 ._-]{1,120}$/.test(value) ? value : null;
}

function safeReferrer(): string | null {
  if (!document.referrer) return null;
  try {
    const referrer = new URL(document.referrer);
    return referrer.origin === location.origin ? referrer.pathname : referrer.origin;
  } catch {
    return null;
  }
}

function safeTarget(value?: string): string | null {
  if (!value) return null;
  try {
    const target = new URL(value, location.origin);
    return target.origin === location.origin ? target.pathname : target.origin;
  } catch {
    return null;
  }
}

function context(payload: EventPayload) {
  const ids = identity();
  const url = new URL(location.href);
  return {
    ...payload,
    target: safeTarget(payload.target),
    ...ids,
    path: url.pathname.slice(0, 500),
    referrer: safeReferrer(),
    source: campaignValue(url, "utm_source"),
    medium: campaignValue(url, "utm_medium"),
    campaign: campaignValue(url, "utm_campaign"),
  };
}

function send(payload: EventPayload, beacon = false) {
  try {
    const body = JSON.stringify(context(payload));
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    });
  } catch {
    // Analytics must never interfere with reading or buying.
  }
}

export function trackAnalytics(payload: EventPayload) {
  if (typeof window !== "undefined") send(payload);
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  const started = useRef(Date.now());

  useEffect(() => {
    started.current = Date.now();
    const depths = new Set<number>();
    let engaged = false;
    send({ event: "page.view" });

    const engagementTimer = window.setTimeout(() => {
      engaged = true;
      send({ event: "page.engaged", durationMs: 10_000 });
    }, 10_000);

    const onScroll = () => {
      const available = document.documentElement.scrollHeight - innerHeight;
      if (available <= 0) return;
      const percent = Math.min(100, Math.round((scrollY / available) * 100));
      for (const milestone of [25, 50, 75, 90, 100]) {
        if (percent >= milestone && !depths.has(milestone)) {
          depths.add(milestone);
          send({ event: "scroll.depth", value: milestone });
        }
      }
    };

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest("a") as HTMLAnchorElement | null;
      const tracked = (event.target as Element | null)?.closest("[data-track]") as HTMLElement | null;
      if (tracked) {
        send({
          event: tracked.dataset.track || "navigation.click",
          label: tracked.dataset.trackLabel,
          target: anchor?.href,
        });
      } else if (anchor) {
        const external = anchor.origin !== location.origin;
        send({
          event: external ? "outbound.click" : "navigation.click",
          target: anchor.href,
        });
      }
    };

    const leave = () => send({
      event: "page.leave",
      durationMs: Date.now() - started.current,
      metadata: { engaged },
    }, true);

    addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    addEventListener("pagehide", leave, { once: true });
    return () => {
      clearTimeout(engagementTimer);
      removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      removeEventListener("pagehide", leave);
      leave();
    };
  }, [pathname, search]);

  useEffect(() => {
    if (!("PerformanceObserver" in window)) return;
    type LayoutShift = PerformanceEntry & { value: number; hadRecentInput: boolean };
    type FirstInput = PerformanceEntry & { processingStart: number };
    const observers: Array<{
      observer: PerformanceObserver;
      process: (entries: PerformanceEntry[]) => void;
    }> = [];
    let lcp: number | null = null;
    let fid: number | null = null;
    let cls = 0;
    let clsWindow = 0;
    let clsWindowStart = 0;
    let clsLast = 0;
    let flushed = false;

    const observe = (type: string, process: (entries: PerformanceEntry[]) => void) => {
      try {
        const observer = new PerformanceObserver((list) => process(list.getEntries()));
        observer.observe({ type, buffered: true });
        observers.push({ observer, process });
      } catch { /* unsupported metric */ }
    };

    observe("largest-contentful-paint", (entries) => {
      const latest = entries.at(-1);
      if (latest) lcp = latest.startTime;
    });
    observe("first-input", (entries) => {
      const first = entries[0] as FirstInput | undefined;
      if (first && fid === null) fid = first.processingStart - first.startTime;
    });
    observe("layout-shift", (entries) => {
      for (const raw of entries as LayoutShift[]) {
        if (raw.hadRecentInput) continue;
        if (raw.startTime - clsLast <= 1_000 && raw.startTime - clsWindowStart <= 5_000) {
          clsWindow += raw.value;
        } else {
          clsWindow = raw.value;
          clsWindowStart = raw.startTime;
        }
        clsLast = raw.startTime;
        cls = Math.max(cls, clsWindow);
      }
    });

    const flush = () => {
      if (flushed) return;
      flushed = true;
      for (const item of observers) item.process(item.observer.takeRecords());
      if (lcp !== null) send({ event: "performance.web-vital", label: "largest-contentful-paint", value: lcp });
      if (fid !== null) send({ event: "performance.web-vital", label: "first-input", value: fid });
      send({ event: "performance.web-vital", label: "layout-shift", value: cls });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVisibility);
      observers.forEach(({ observer }) => observer.disconnect());
    };
  }, []);

  return null;
}
