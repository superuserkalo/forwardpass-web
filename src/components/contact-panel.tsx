"use client";

import { ContactForm } from "@/components/forward-pass-forms";
import { ModalPanel } from "@/components/modal-panel";

export function ContactPanel() {
  return (
    <ModalPanel label="Contact The Forward Pass">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Contact</p>
      <h2 className="font-display mt-4 max-w-xl text-3xl font-medium leading-tight tracking-[-0.02em] sm:text-4xl">
        Get in touch.
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        A question, a correction or a tip. Your message goes straight to the team.
      </p>
      <ContactForm />
    </ModalPanel>
  );
}
