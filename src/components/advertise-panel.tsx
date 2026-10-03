"use client";

import { AdvertisingForm } from "@/components/forward-pass-forms";
import { ModalPanel } from "@/components/modal-panel";

export function AdvertisePanel() {
  return (
    <ModalPanel label="Advertise with The Forward Pass">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Advertising &amp; sponsorship</p>
      <h2 className="font-display mt-4 max-w-xl text-3xl font-medium leading-tight tracking-[-0.02em] sm:text-4xl">
        Building for AI engineers?
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Reach an audience of AI engineers, researchers, technical founders and people building the next generation of AI systems.
      </p>
      <AdvertisingForm />
    </ModalPanel>
  );
}
