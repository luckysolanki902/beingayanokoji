import type { Metadata } from "next";
import { AnimatedText, FadeIn } from "@/components/AnimatedText";

export const metadata: Metadata = {
  title: "Philosophy",
  description:
    "Why this site exists, who it is for, and what it refuses to be. The contract between the writer and the reader.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)] mb-6">
            The philosophy
          </p>
        </FadeIn>

        <AnimatedText
          as="h1"
          text="A training ground for the mind, body, and operator."
          className="font-serif text-4xl md:text-6xl tracking-tight font-medium leading-[1.05]"
          stagger={0.03}
        />

        <div className="prose-lecture mt-16">
          <FadeIn>
            <p>
              This site exists for a specific reader. They are intelligent but
              underdeveloped — capacity exceeds output. They have read a hundred
              self-improvement essays and converted almost none into change. They are
              suspicious of motivational fluff and close the tab the moment they smell
              it. They want to be respected, capable, and free.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <p>
              The site is named for Kiyotaka Ayanokoji because he embodies a specific
              synthesis: deep observation, restrained action, calculated patience, and
              emotional opacity. It is not fan-fiction. The character is the lens, not
              the subject.
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            <h2>The contract</h2>
            <p>
              By reading, the reader agrees to be treated as an adult capable of
              difficult ideas. In return, the site agrees to never waste their time
              with platitudes or content padding, never moralize or hedge into
              uselessness, always cite real sources, and always end with something
              the reader can do this week.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h2>The four dimensions</h2>
            <p>
              Every lecture moves the reader along at least one of four axes:
              <em> cognitive</em> — clearer thinking under pressure;
              <em> psychological</em> — regulation through granularity rather than
              suppression; <em>physical</em> — strength, conditioning, longevity; and
              <em> strategic</em> — leverage, influence, and life design. The four
              compound. None is separable.
            </p>
          </FadeIn>

          <FadeIn delay={0.25}>
            <h2>What this is not</h2>
            <p>
              It is not a self-help blog of motivational quotes. It is not a productivity
              site selling tools. It is not a stoicism-aesthetic Instagram brand. It is
              not a hustle-culture pipeline. It is not religious, political, or
              ideological. It does not promise transformation. It does not flatter.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <h2>A note on voice</h2>
            <p>
              The voice is calm and confident <em>because</em> the underlying analysis is
              sound, not as performance. When the evidence is uncertain, the prose
              reflects that. Strong claims do not need to shout.
            </p>
          </FadeIn>

          <hr />

          <FadeIn delay={0.35}>
            <p className="font-serif italic text-[color:var(--color-muted)]">
              Calm in tone. Heavy in substance. Quiet in delivery. Compounding in effect.
            </p>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
