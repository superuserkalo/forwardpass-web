"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";

const SigilField = dynamic(
  () => import("@/components/sigil-field").then((m) => m.SigilField),
  { ssr: false },
);

export function Sigil() {
  const bandRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={bandRef}
      className="relative h-[220px] overflow-hidden border-b border-border sm:h-[280px] md:h-[320px]"
    >
      <SigilField bandRef={bandRef} />
    </div>
  );
}
