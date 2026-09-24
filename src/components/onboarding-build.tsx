"use client";

import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import type { ReadingProfile } from "@/lib/onboarding";

export function OnboardingBuild({
  profile,
  saved,
  onComplete,
}: {
  profile: ReadingProfile;
  saved: boolean;
  onComplete: () => void;
}) {
  const [stage, setStage] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timers = [400, 950, 1500, 2050, 2600].map((delay, index) =>
      window.setTimeout(() => setStage(index + 1), reducedMotion ? 0 : delay),
    );
    return () => timers.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    if (!saved || stage < 5) return;
    // Let the completed terminal remain readable before changing screens.
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timer = window.setTimeout(onComplete, reducedMotion ? 0 : 650);
    return () => window.clearTimeout(timer);
  }, [saved, stage, onComplete]);

  const lines = [
    `Reading your topics · ${profile.topics.length} selected`,
    `Setting content · ${profile.content.join(", ")}`,
    `Applying your role · ${profile.role.toLowerCase()}`,
    `Setting format · ${profile.format.toLowerCase()}`,
  ];

  return (
    <div className="py-12 sm:py-20">
      <h1 ref={heading} tabIndex={-1} className="onboarding-title text-center">
        Preparing your reading brief.
      </h1>
      <p className="mt-5 text-center font-mono text-xs text-muted-foreground">
        This takes a few seconds.
      </p>
      <div
        className="mx-auto mt-10 min-h-56 max-w-lg border border-border bg-muted/30 p-5 font-mono text-xs leading-7 sm:p-6 sm:text-sm"
        role="log"
        aria-label="Reading brief setup"
        aria-live="polite"
        aria-relevant="additions text"
      >
        <p className="mb-1 break-words">
          <span className="mr-2 text-muted-foreground">$</span>
          forwardpass prepare --reader {profile.firstName}
        </p>
        {lines.slice(0, stage).map((line, index) => (
          <p key={line} className="flex items-start gap-3">
            {stage > index + 1 ? (
              <Check aria-hidden className="mt-2 size-3 shrink-0" />
            ) : (
              <LoaderCircle
                aria-hidden
                className="mt-2 size-3 shrink-0 animate-spin motion-reduce:animate-none"
              />
            )}
            <span>{line}</span>
          </p>
        ))}
        {stage >= 5 && (
          <p className="flex items-start gap-3">
            {saved ? (
              <Check aria-hidden className="mt-2 size-3 shrink-0" />
            ) : (
              <LoaderCircle
                aria-hidden
                className="mt-2 size-3 shrink-0 animate-spin motion-reduce:animate-none"
              />
            )}
            <span>
              {saved ? "Reading brief ready" : "Saving your preferences…"}
            </span>
          </p>
        )}
        {stage === 0 && (
          <span aria-hidden className="onboarding-cursor">
            ▌
          </span>
        )}
      </div>
    </div>
  );
}
