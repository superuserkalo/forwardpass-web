"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { AdvertisingForm } from "@/components/forward-pass-forms";

export function CollaboratePanel() {
  const router = useRouter();

  const close = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }, [router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={close}
        className="absolute inset-0 bg-black/15 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Collaborate with The Forward Pass"
        className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-background/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_40px_90px_-30px_rgba(0,0,0,0.8)] backdrop-blur-2xl md:p-8"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-muted-foreground transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Advertising &amp; sponsorship</p>
        <h2 className="font-display mt-4 max-w-xl text-3xl font-medium leading-tight tracking-[-0.02em] sm:text-4xl">
          Building for AI engineers?
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Reach an audience of AI engineers, researchers, technical founders and people building the next generation of AI systems.
        </p>
        <AdvertisingForm />
      </div>
    </div>
  );
}
