import Image from "next/image";
import type { LectureImage } from "@/lib/lecture-images";

/**
 * The band of artwork at the head of a lecture.
 *
 * Sized as a wide letterbox so it sits under the title without pushing the
 * first paragraph below the fold, the essay is the point, and a full-bleed
 * hero would bury it. `contain` art (cut-outs with their own white ground) is
 * letterboxed on the page background instead of being cropped, since cropping
 * a figure at the knees looks like a mistake rather than a decision.
 *
 * `priority` because this is the largest element above the fold on a lecture
 * page; without it, it is the last thing to arrive and the layout jumps.
 */
export function LectureBanner({ image }: { image: LectureImage }) {
  return (<figure className="relative mt-10 aspect-[21/9] w-full overflow-hidden border border-[color:var(--rule)] bg-[color:var(--bg-elevated)]">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="(max-width: 768px) 100vw, 768px"
        className={image.contain ? "object-contain" : "object-cover"}
        style={image.contain ? undefined : { objectPosition: image.position ?? "center" }}
      />
    </figure>);
}
