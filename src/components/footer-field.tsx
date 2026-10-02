"use client";

import dynamic from "next/dynamic";
import { useRef, type ReactNode } from "react";

const SigilField = dynamic(
  () => import("@/components/sigil-field").then((m) => m.SigilField),
  { ssr: false },
);

/**
 * The footer's frame. The glyph field runs behind the whole footer with the wordmark resting along the
 * bottom edge, and a fade keeps the top calm so the links stay readable.
 */
export function FooterField({ children }: { children: ReactNode }) {
  const footerRef = useRef<HTMLElement>(null);

  return (
    <footer ref={footerRef} className="relative isolate overflow-hidden border-t border-border">
      <SigilField bandRef={footerRef} anchor="bottom" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-3/4 bg-gradient-to-b from-background via-background/75 to-transparent"
      />
      <div className="relative">{children}</div>
    </footer>
  );
}
