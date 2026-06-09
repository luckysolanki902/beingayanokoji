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
    <div className="border border-[color:var(--color-rule)] bg-[color:var(--color-bg-elevated)]/50 p-8 md:p-10 flex flex-col md:flex-row gap-8 md:gap-10 items-start">
      <div className="shrink-0 bg-white p-3 self-center md:self-start">
        <Image
          src="/qr.jpeg"
          alt="UPI QR code — scan with any UPI app to send a contribution"
          width={qrSize}
          height={qrSize}
          className="block"
          priority={false}
        />
        <p className="mt-2 text-center text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-faint)] text-black/60">
          scan with any upi app
        </p>
      </div>

      <div className="flex-1 space-y-4">
        {showHeader && (
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
            Keep the desk lit
          </p>
        )}
        <p className="font-serif text-2xl md:text-3xl tracking-tight leading-snug">
          The lectures are free.
          <span className="block italic text-[color:var(--color-accent)]">
            The writing isn&apos;t.
          </span>
        </p>
        <p className="text-sm md:text-base text-[color:var(--color-muted)] leading-relaxed">
          Each lecture takes real hours of research and writing, and hosting
          costs real money. The QR is the entire transaction — no email
          capture, no upsell, no follow-up.
        </p>
        <ul className="text-sm text-[color:var(--color-muted)] space-y-1.5 pl-1">
          <li className="flex gap-3">
            <span className="text-[color:var(--color-faint)]">→</span>
            <span>
              <span className="text-[color:var(--color-fg)]">One coffee</span>
              {" — roughly an hour at the desk."}
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-[color:var(--color-faint)]">→</span>
            <span>
              <span className="text-[color:var(--color-fg)]">Five</span>
              {" — the next lecture's reading list."}
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-[color:var(--color-faint)]">→</span>
            <span>
              <span className="text-[color:var(--color-fg)]">A month</span>
              {" of hosting fits in two."}
            </span>
          </li>
        </ul>
        <p className="text-xs text-[color:var(--color-faint)] italic pt-1">
          The site continues regardless. The contribution just makes the next
          lecture arrive faster.
        </p>
      </div>
    </div>
  );
}
