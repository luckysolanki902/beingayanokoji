"use client";

import Image from "next/image";

export function SupportBlock({
  compact = false,
  showHeader = true,
}: {
  compact?: boolean;
  showHeader?: boolean;
}) {
  const qrSize = compact ? 156 : 196;

  return (
    <section className="border border-[color:var(--color-rule)] bg-[color:var(--color-bg-elevated)]/60 p-6 md:p-10">
      <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-center md:items-start">
        <div className="shrink-0 bg-white p-3 shadow-sm">
          <Image
            src="/qr.jpeg"
            alt="UPI QR code — scan with any UPI app to support the lectures"
            width={qrSize}
            height={qrSize}
            className="block"
            priority={false}
          />

          <p className="mt-3 text-center text-[10px] uppercase tracking-[0.18em] text-black/60">
            scan with any UPI app
          </p>
        </div>

        <div className="flex-1 space-y-5 text-center md:text-left">
          {showHeader && (
            <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
              Support the work
            </p>
          )}

          <div className="space-y-3">
            <h2 className="font-serif text-2xl md:text-4xl tracking-tight leading-tight">
              Keep the lectures free.
              <span className="block italic text-[color:var(--color-accent)]">
                Help fund the next one.
              </span>
            </h2>

            <p className="text-sm md:text-base text-[color:var(--color-muted)] leading-relaxed max-w-2xl">
              Every lecture takes hours of reading, structuring, writing, editing,
              and maintaining the site. If the work helped you think clearer,
              you can support it directly through UPI.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[color:var(--color-muted)]">
            <div className="border border-[color:var(--color-rule)] p-3">
              No login
            </div>
            <div className="border border-[color:var(--color-rule)] p-3">
              No email capture
            </div>
            <div className="border border-[color:var(--color-rule)] p-3">
              No upsell
            </div>
          </div>

          <p className="text-xs text-[color:var(--color-faint)] italic">
            The site stays free either way. Your contribution simply makes the
            next lecture easier to produce.
          </p>
        </div>
      </div>
    </section>
  );
}