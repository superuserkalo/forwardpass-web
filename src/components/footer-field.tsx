"use client";

import dynamic from "next/dynamic";
import { useRef, type ReactNode } from "react";

const SigilField = dynamic(
  () => import("@/components/sigil-field").then((m) => m.SigilField),
  { ssr: false },
);

/**
 * The footer's frame. The glyph field runs behind the whole footer, top to bottom, with the wordmark
 * resting along the bottom edge.
 */
export function FooterField({ children }: { children: ReactNode }) {
  const footerRef = useRef<HTMLElement>(null);

  return (
    <footer ref={footerRef} className="relative isolate overflow-hidden border-t border-border">
      <SigilField bandRef={footerRef} anchor="bottom" />
      <div className="relative">{children}</div>
    </footer>
  );
}
