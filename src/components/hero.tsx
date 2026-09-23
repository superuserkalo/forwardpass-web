"use client";

import dynamic from "next/dynamic";

const HeroField = dynamic(
  () => import("@/components/hero-field").then((m) => m.HeroField),
  { ssr: false },
);

export function Hero() {
  return <HeroField />;
}
