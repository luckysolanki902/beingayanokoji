import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-48 pb-24 px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)] mb-6">
        404
      </p>
      <h1 className="font-serif text-5xl md:text-7xl tracking-tight font-medium mb-6">
        Nothing here.
      </h1>
      <p className="text-[color:var(--color-muted)] font-serif italic mb-12">
        The path was either renamed or never existed. Both happen.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-3 px-6 py-3 border border-[color:var(--color-fg)] hover:bg-[color:var(--color-fg)] hover:text-[color:var(--color-bg)] transition-all duration-300 text-sm"
      >
        ← Return to the index
      </Link>
    </div>
  );
}
