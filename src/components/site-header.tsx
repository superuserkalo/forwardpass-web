"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArchiveShellSkeleton } from "./archive/skeletons";
import { BrandLockup } from "./brand-lockup";

export function SiteHeader() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
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
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              <span className="sm:hidden">Personal AI</span>
              <span className="hidden sm:inline">Personal AI newsletter</span>
            </Link>
            <Link href="/archive" onNavigate={() => {
              if (pathname !== "/archive") setOpeningArchive(true);
            }} className="text-sm text-muted-foreground transition-colors hover:text-foreground">Archive</Link>
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
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-background">
          <ArchiveShellSkeleton withBrand />
        </div>,
        document.body,
      )}
    </>
  );
}
