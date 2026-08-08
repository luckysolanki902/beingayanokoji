"use client";

import { signOut } from "@/app/actions/auth";

/**
 * A form rather than an onClick, so signing out is a POST.
 *
 * A GET that ends a session can be triggered by any image tag on any page,
 * which is a small, silly denial of service someone will eventually try.
 */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className={
          className ??
          "text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)]"
        }
      >
        Sign out
      </button>
    </form>
  );
}
