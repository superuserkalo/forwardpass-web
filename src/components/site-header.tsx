"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BrandLockup } from "./brand-lockup";

export function SiteHeader() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [openingArchive, setOpeningArchive] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      setScrolled(!(entries[0]?.isIntersecting ?? true));
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px" />
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrolled
            ? "border-b border-border bg-background/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-10 md:py-5">
          <BrandLockup />
          <div className="flex items-center gap-5">
            <Link href="/archive" onNavigate={() => setOpeningArchive(true)} className="text-sm text-muted-foreground transition-colors hover:text-foreground">Archive</Link>
            <Link
              href="/collaborate"
              className="bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90 active:scale-[0.98]"
            >
              Collaborate
            </Link>
          </div>
        </div>
      </header>
      {openingArchive && createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-background" aria-busy="true">
          <div className="mx-auto min-h-screen max-w-7xl px-5 pb-24 pt-10 md:px-10 md:pt-16">
            <BrandLockup />
            <div className="mt-24 border-b border-border pb-10 md:mt-32">
              <p className="onboarding-eyebrow">Published editions</p>
              <h1 className="font-[family-name:var(--font-editorial)] text-5xl leading-none md:text-7xl">The archive.</h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
                Read the issues we have published. Your active plan determines how far back you can go.
              </p>
            </div>
            <p className="border-b border-border py-5 text-xs text-muted-foreground" role="status">Loading the latest stories…</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
