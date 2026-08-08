import Link from "next/link";

/**
 * The graduation certificate, and the specimen everyone else gets.
 *
 * Both come from the same route. Which one the server draws is decided from the
 * record, not from anything this component passes, so the props below only
 * control the *copy*; getting them wrong would write a misleading sentence, not
 * hand anyone a certificate they had not earned.
 *
 * That is worth stating plainly on the page rather than hiding, which is why
 * the copy says the specimen is a specimen. A blur that looks like a
 * withheld secret invites people to try to lift it. A blur that is openly a
 * printed sample of somebody else's certificate does not.
 */
export function CertificatePanel({
  graduated,
  passed,
  total,
}: {
  graduated: boolean;
  passed: number;
  total: number;
}) {
  const remaining = Math.max(0, total - passed);

  return (
    <section className="mt-16">
      <h2 className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
        卒業証書
      </h2>
      <h3 className="font-serif mt-3 text-2xl tracking-tight">
        {graduated ? "Your certificate." : "The certificate you have not earned."}
      </h3>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--muted)]">
        {graduated ? (
          <>
            You have passed every examination this school sets. There is nothing
            above this and nothing waiting on the other side of it, which was
            always the point. Take the certificate; it is the only thing here
            that cannot be bought.
          </>
        ) : (
          <>
            What is below is not your certificate with something laid over it.
            It is a printed specimen belonging to the school&apos;s example
            student, and your name is not in the file. There is nothing on this
            page to defeat. {remaining} examination{remaining === 1 ? "" : "s"}{" "}
            stand between you and the real one, and passing them is the only
            method that has ever worked.
          </>
        )}
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/api/certificate"
        alt={
          graduated
            ? "Your certificate of graduation"
            : "A blurred specimen certificate belonging to an example student"
        }
        width={1400}
        height={990}
        className="mt-6 w-full border border-[color:var(--rule)]"
      />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {graduated ? (
          <a
            href="/api/certificate"
            download="ayanokoji-graduation-certificate.png"
            className="border border-[color:var(--accent)] bg-[color:var(--accent)]/10 px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--accent)] hover:text-[color:var(--bg)]"
          >
            Download the certificate
          </a>
        ) : (
          <>
            <span className="border border-[color:var(--rule)] px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] text-[color:var(--faint)]">
              {passed} of {total} examinations passed
            </span>
            <Link
              href="/lectures"
              className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)]"
            >
              Go and sit the next one
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
