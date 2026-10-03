"use client";

import dynamic from "next/dynamic";
import { useRef, type ReactNode } from "react";

const SigilField = dynamic(
  () => import("@/components/sigil-field").then((m) => m.SigilField),
  { ssr: false },
);

/**
 * The footer's frame. The links sit above and the glyph wordmark closes on the bottom edge, built
 * from the same scattered characters as the rest of the field.
 */
export function FooterField({ children }: { children: ReactNode }) {
  const footerRef = useRef<HTMLElement>(null);
  const markRef = useRef<HTMLDivElement>(null);

  return (
    <footer ref={footerRef} className="relative isolate overflow-hidden border-t border-border">
      <div className="relative">{children}</div>
      <div ref={markRef} className="relative h-[clamp(5rem,13vw,11rem)] w-full overflow-hidden">
        <SigilField bandRef={markRef} anchor="bottom" />
      </div>
    </footer>
  );
}
