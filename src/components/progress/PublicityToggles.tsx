"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setPublicity } from "@/app/actions/profile";

/**
 * The two decisions a student makes about being visible.
 *
 * Kept as two switches rather than one, because they are genuinely different
 * questions and bundling them would be the dishonest option: agreeing to be
 * ranked is not agreeing to have your face on the front page. The photograph
 * switch is disabled entirely until there is a photograph to show, so it can
 * never be left on as a promise about a file that does not exist.
 */
export function PublicityToggles({
  listed,
  photoPublic,
  hasPhoto,
  studentNumber,
  usingDefaultName,
}: {
  listed: boolean;
  photoPublic: boolean;
  hasPhoto: boolean;
  studentNumber: string;
  /** True when their name still looks like it came from their email address. */
  usingDefaultName: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(next: { listed?: boolean; photoPublic?: boolean }) {
    setError(null);
    startTransition(async () => {
      const result = await setPublicity(next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="mt-14">
      <h2 className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
        公開設定
      </h2>
      <h3 className="font-serif mt-3 text-2xl tracking-tight">
        What the rest of the school can see.
      </h3>

      <div className="mt-6 divide-y divide-[color:var(--rule)] border-y border-[color:var(--rule)]">
        <Switch
          on={listed}
          disabled={pending}
          onChange={(v) => toggle({ listed: v })}
          title="Show my profile on the COTE leaderboard"
          note={
            listed ? (
              <>
                Your name, class and balance are public, and your page is at{" "}
                <Link
                  href={`/students/${studentNumber}`}
                  className="underline decoration-[color:var(--rule)] underline-offset-4 hover:text-[color:var(--fg)]"
                >
                  /students/{studentNumber}
                </Link>
                . Your email address never is.
              </>
            ) : (
              "You are not ranked and your public page returns nothing."
            )
          }
        />

        <Switch
          on={photoPublic && hasPhoto}
          disabled={pending || !hasPhoto}
          onChange={(v) => toggle({ photoPublic: v })}
          title="Show my profile picture on the COTE leaderboard"
          note={
            hasPhoto
              ? photoPublic
                ? listed
                  ? "Your card photograph appears on the COTE leaderboard and on your public page."
                  : "Your photograph is approved, but is not visible while your profile is off the COTE leaderboard."
                : "Your photograph stays on your own card only. The roll shows your class letter instead."
              : "Upload a photograph to your card first."
          }
        />
      </div>

      {usingDefaultName && (
        <p className="mt-4 border-l-2 border-[color:var(--accent)] pl-4 text-sm leading-relaxed text-[color:var(--muted)]">
          You have not chosen a name, so the register is still holding the one
          taken from your email address. It is not shown publicly for that
          reason: the roll lists you as{" "}
          <span className="text-[color:var(--fg)]">Student {studentNumber}</span>{" "}
          until you set one. The first change is free.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-[color:var(--muted)]">
          {error}
        </p>
      )}
    </section>
  );
}

function Switch({
  on,
  disabled,
  onChange,
  title,
  note,
}: {
  on: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
  title: string;
  note: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-5">
      <div className="min-w-0">
        <p className="text-sm text-[color:var(--fg)]">{title}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--muted)]">
          {note}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!on)}
        className={`mt-1 flex h-6 w-11 shrink-0 items-center border p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          on
            ? "justify-end border-[color:var(--accent)] bg-[color:var(--accent)]/20"
            : "justify-start border-[color:var(--rule)]"
        }`}
      >
        <span
          className={`h-4 w-4 transition-colors ${
            on ? "bg-[color:var(--accent)]" : "bg-[color:var(--faint)]"
          }`}
        />
      </button>
    </div>
  );
}
