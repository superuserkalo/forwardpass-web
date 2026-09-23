"use client";

import dynamic from "next/dynamic";

const ForwardPassField = dynamic(
  () => import("@/components/forward-pass-field").then((m) => m.ForwardPassField),
  { ssr: false },
);

export function ForwardPass() {
  return <ForwardPassField />;
}
