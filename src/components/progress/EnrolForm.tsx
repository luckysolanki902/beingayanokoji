"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "motion/react";
import { enrol, type EnrolState } from "@/app/actions/auth";

/**
 * One form for both doors.
 *
 * There is no "already have an account?" toggle, because the server can work
 * that out from the address and asking the reader to remember is a question
 * with no good answer at two in the morning. An address on the register is a
 * sign-in; an address that is not is an enrolment.
 *
 * It is a real `<form>` with a server action rather than a fetch, so it works
 * before the JavaScript has arrived and the browser's own password manager
 * recognises it as what it is.
 */

const INITIAL: EnrolState = { error: null, outcome: null };

export function EnrolForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(enrol, INITIAL);

  return (<motion.form
      action={formAction}
      data-track="auth.submit"
      data-track-label="enrol-or-sign-in"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto mt-12 w-full max-w-sm"
    >
      {next && <input type="hidden" name="next" value={next} />}

      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
          Email
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          spellCheck={false}
          placeholder="you@example.com"
          className="mt-2 w-full border border-[color:var(--rule)] bg-transparent px-4 py-3 text-base outline-none transition-colors placeholder:text-[color:var(--faint)] focus:border-[color:var(--accent)] sm:text-sm"
        />
      </label>

      <label className="mt-6 block">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
          Password
        </span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          // `current-password` rather than `new-password`: the form is a
          // sign-in as often as it is a registration, and offering to generate
          // a password to a returning reader is the more annoying mistake.
          autoComplete="current-password"
          placeholder="At least 8 characters"
          className="mt-2 w-full border border-[color:var(--rule)] bg-transparent px-4 py-3 text-base outline-none transition-colors placeholder:text-[color:var(--faint)] focus:border-[color:var(--accent)] sm:text-sm"
        />
      </label>

      {state.error && (<p
          role="alert"
          className="mt-5 border-l-2 border-red-500/60 pl-3 text-sm leading-relaxed text-[color:var(--muted)]"
        >
          {state.error}
        </p>)}

      <SubmitButton />

      <p className="mt-6 text-center text-xs leading-relaxed text-[color:var(--faint)]">
        No verification email, because there is nothing to verify, the address
        is a name on a register, not a channel. Nothing is ever sent to it.
      </p>
    </motion.form>);
}

function SubmitButton() {
  // `useFormStatus` reads the pending state of the form this button sits in,
  // which is why it is a separate component: the hook reports nothing when
  // called from the component that renders the form itself.
  const { pending } = useFormStatus();

  return (<button
      type="submit"
      disabled={pending}
      className="mt-8 w-full border border-[color:var(--fg)] px-7 py-3.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--fg)] hover:text-[color:var(--bg)] disabled:opacity-40"
    >
      {pending ? "Checking the register…" : "Enrol or sign in"}
    </button>);
}
