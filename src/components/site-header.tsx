"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { ArchiveShellSkeleton } from "./archive/skeletons";
import { BrandLockup } from "./brand-lockup";

export function SiteHeader() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [openingArchive, setOpeningArchive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  const onArchiveNavigate = () => {
    if (pathname !== "/archive") setOpeningArchive(true);
  };

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
          scrolled || menuOpen
            ? "border-b border-border bg-background/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-10 md:py-5">
          <BrandLockup />
          <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Personal AI newsletter
            </Link>
            <Link href="/archive" onNavigate={onArchiveNavigate} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Archive
            </Link>
            <Link
              href="/collaborate"
              className="bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90 active:scale-[0.98]"
            >
              Collaborate
            </Link>
          </nav>
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="-mr-2 flex size-11 items-center justify-center text-foreground md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Main"
            className="flex h-[calc(100dvh-4.5rem)] flex-col border-t border-border bg-background px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 md:hidden"
          >
            <Link href="/pricing" onClick={() => setMenuOpen(false)} className="border-b border-border py-5 font-display text-3xl text-foreground">
              Personal AI newsletter
            </Link>
            <Link
              href="/archive"
              onNavigate={onArchiveNavigate}
              onClick={() => setMenuOpen(false)}
              className="border-b border-border py-5 font-display text-3xl text-foreground"
            >
              Archive
            </Link>
            <Link
              href="/collaborate"
              onClick={() => setMenuOpen(false)}
              className="mt-auto flex h-12 items-center justify-center bg-primary text-sm font-medium text-primary-foreground active:scale-[0.98]"
            >
              Collaborate
            </Link>
          </nav>
        )}
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
