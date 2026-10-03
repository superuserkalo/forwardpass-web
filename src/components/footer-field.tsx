"use client";

import dynamic from "next/dynamic";
import { useRef, type ReactNode } from "react";

const SigilField = dynamic(
  () => import("@/components/sigil-field").then((m) => m.SigilField),
  { ssr: false },
);

/**
 * The footer's frame. The glyph band runs across the top with the wordmark inside it, and the link
 * columns sit beneath on open rules.
 */
export function FooterField({ children }: { children: ReactNode }) {
  const bandRef = useRef<HTMLDivElement>(null);

  return (
    <footer className="relative isolate overflow-hidden border-t border-border">
      <div ref={bandRef} className="relative h-[clamp(6.5rem,17vw,14rem)] overflow-hidden border-b border-border">
        <SigilField bandRef={bandRef} anchor="center" />
      </div>
      <div className="relative">{children}</div>
    </footer>
  );
}
