"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removePhoto, updateName, updatePhoto } from "@/app/actions/profile";

/**
 * The student card, and the controls that change what is printed on it.
 *
 * The card itself is a PNG rendered by the server; this is only the frame
 * around it. That split is deliberate. Drawing the card twice, once in HTML for
 * the page and once in an image for the download, would mean two designs to
 * keep in step and a download that slowly stops matching what the reader was
 * looking at. One renderer, one card.
 *
 * Until it is issued, the preview carries a specimen band burned into the
 * pixels. Nothing here enforces that and nothing here could: the mark is drawn
 * server-side, so saving the image, screenshotting it or fetching the URL
 * directly all produce the same marked file. Issuing is the only thing that
 * produces a clean one, and issuing charges.
 */
export function IdCard({
  name,
  issued,
  price,
  nameChangePrice,
  balance,
}: {
  name: string;
  /** Whether the card has been bought. Decided on the server. */
  issued: boolean;
  price: number;
  /** What the next name change costs. Zero while the first one is free. */
  nameChangePrice: number;
  balance: number;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [issuing, setIssuing] = useState(false);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(name);

  // A cache-buster. The card is served `no-store`, but a browser that has just
  // uploaded a photo still needs telling that the bytes behind an unchanged
  // URL are different now.
  const src = `/api/id-card?v=${version}`;

  /**
   * Resize and re-encode in the browser before anything is uploaded.
   *
   * A phone photo is three to six megabytes and the card prints it at 224
   * pixels wide. Sending the original would mean a slow upload, a rejected
   * request and a row in the database eighty times larger than it needs to be,
   * to draw exactly the same card. So the file never leaves in its original
   * form: it is drawn into a canvas at card size and re-encoded as JPEG, which
   * also strips whatever EXIF the camera attached, including where it was
   * taken.
   */
  async function prepare(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);

    const TARGET_W = 448;
    const TARGET_H = 576;
    const scale = Math.max(TARGET_W / bitmap.width, TARGET_H / bitmap.height);
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;

    const canvas = document.createElement("canvas");
    canvas.width = TARGET_W;
    canvas.height = TARGET_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no-canvas");
    ctx.drawImage(bitmap, (TARGET_W - w) / 2, (TARGET_H - h) / 2, w, h);
    bitmap.close?.();

    return canvas.toDataURL("image/jpeg", 0.82);
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setNotice(null);

    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) {
      setError("Choose a JPEG, PNG or WebP.");
      return;
    }

    startTransition(async () => {
      let dataUrl: string;
      try {
        dataUrl = await prepare(file);
      } catch {
        setError("That image could not be read. Try another.");
        return;
      }

      const result = await updatePhoto(dataUrl);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setVersion((v) => v + 1);
      router.refresh();
    });
  }

  /**
   * Issue, or re-download an already issued card.
   *
   * Fetched rather than linked so the 402 can be read and explained. A plain
   * anchor would navigate the reader to a page of error text.
   */
  async function issue() {
    setError(null);
    setNotice(null);
    setIssuing(true);
    try {
      const res = await fetch("/api/id-card/download", { cache: "no-store" });
      if (res.status === 402) {
        setError(await res.text());
        return;
      }
      if (!res.ok) {
        setError("The card could not be issued. Try again.");
        return;
      }

      const charged = Number(res.headers.get("X-Card-Charged") ?? 0);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cote-student-card.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setNotice(
        charged > 0
          ? `Issued. ${charged} points taken, and the card is yours to take again whenever your record changes.`
          : "Downloaded. You already own this card, so it cost nothing."
      );
      setVersion((v) => v + 1);
      router.refresh();
    } catch {
      setError("The card could not be issued. Try again.");
    } finally {
      setIssuing(false);
    }
  }

  function clearPhoto() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await removePhoto();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setVersion((v) => v + 1);
      router.refresh();
    });
  }

  function saveName() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await updateName(draftName);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditingName(false);
      setVersion((v) => v + 1);
      if (result.charged) setNotice(`Name changed. ${result.charged} points taken.`);
      router.refresh();
    });
  }

  const canAfford = balance >= price;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-hand text-xs tracking-[0.24em] text-[color:var(--muted)]">
          学生証
        </h2>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--faint)]">
          {issued ? "Issued" : "Not issued"}
        </span>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`Student card for ${name}`}
        width={1012}
        height={638}
        className="mt-4 w-full border border-[color:var(--rule)]"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            // Reset, so choosing the same file twice still fires a change.
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={issue}
          disabled={issuing || (!issued && !canAfford)}
          className="border border-[color:var(--accent)] bg-[color:var(--accent)]/10 px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--accent)] hover:text-[color:var(--bg)] disabled:cursor-not-allowed disabled:border-[color:var(--rule)] disabled:bg-transparent disabled:text-[color:var(--faint)] disabled:hover:bg-transparent"
        >
          {issuing
            ? "Issuing…"
            : issued
              ? "Download the card"
              : canAfford
                ? `Issue the card · ${price} points`
                : `${price} points · you have ${balance}`}
        </button>

        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={pending}
          className="border border-[color:var(--rule)] px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:border-[color:var(--fg)] disabled:opacity-40"
        >
          {pending ? "Working…" : "Upload a photograph"}
        </button>

        <button
          type="button"
          onClick={clearPhoto}
          disabled={pending}
          className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)] disabled:opacity-40"
        >
          Remove photo
        </button>
      </div>

      {!issued && (
        <p className="mt-3 text-xs leading-relaxed text-[color:var(--faint)]">
          The card above is marked because it has not been issued. Issuing costs{" "}
          {price} points and removes the mark; after that you can take a fresh
          copy whenever your class or balance changes, at no further cost.
        </p>
      )}

      {/* The name is the one thing on the card a student chooses. */}
      <div className="mt-5">
        {editingName ? (
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={60}
              aria-label="The name printed on your card"
              className="border border-[color:var(--rule)] bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-[color:var(--accent)]"
            />
            <button
              type="button"
              onClick={saveName}
              disabled={pending}
              className="border border-[color:var(--accent)] px-5 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--accent)] hover:text-[color:var(--bg)] disabled:opacity-40"
            >
              {nameChangePrice > 0 ? `Save · ${nameChangePrice} points` : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftName(name);
                setEditingName(false);
              }}
              className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)] hover:text-[color:var(--fg)]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--fg)]"
          >
            Change the name on the card
            {nameChangePrice > 0 ? ` · ${nameChangePrice} points` : " · free once"}
          </button>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-[color:var(--faint)]">
        The photograph is resized to card size in your browser before it is
        sent, which also removes whatever location and camera data your phone
        attached to it. Nothing else ever sees it.
      </p>

      {notice && (
        <p className="mt-3 text-sm text-[color:var(--accent)]">{notice}</p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-[color:var(--muted)]">
          {error}
        </p>
      )}
    </section>
  );
}
