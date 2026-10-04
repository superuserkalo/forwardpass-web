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
  // The header now lives in a shared layout, so it outlasts the navigation it started.
  if (openingArchive && pathname === "/archive") setOpeningArchive(false);
  // The menu is open only on the page it was opened from, so navigating closes it.
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null);
  if (menuOpenAt !== null && menuOpenAt !== pathname) setMenuOpenAt(null);
  const menuOpen = menuOpenAt === pathname;

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpenAt(null);
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setMenuOpenAt(null);
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
        <div className="page-shell flex items-center justify-between py-4 md:py-5">
          <BrandLockup />
          <nav aria-label="Main" className="hidden items-center gap-3 lg:flex">
            <Link href="/pricing" className="dither-box dither-ghost px-5 py-2.5 text-sm font-medium">
              Personal AI newsletter
            </Link>
            <Link href="/archive" onNavigate={onArchiveNavigate} className="dither-box dither-ghost px-5 py-2.5 text-sm font-medium">
              Archive
            </Link>
            <Link href="/signals" className="dither-box dither-ghost px-5 py-2.5 text-sm font-medium">
              Live signals
            </Link>
            <Link
              href="/advertise"
              className="dither-box dither-solid px-5 py-2.5 text-sm font-medium"
            >
              Advertise
            </Link>
          </nav>
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpenAt(menuOpen ? null : pathname)}
            className="-mr-2 flex size-11 items-center justify-center text-foreground lg:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Main"
            className="flex h-[calc(100dvh-4.5rem)] flex-col border-t border-border bg-background px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 lg:hidden"
          >
            <Link href="/pricing" onClick={() => setMenuOpenAt(null)} className="border-b border-border py-5 font-display text-3xl text-foreground">
              Personal AI newsletter
            </Link>
            <Link
              href="/archive"
              onNavigate={onArchiveNavigate}
              onClick={() => setMenuOpenAt(null)}
              className="border-b border-border py-5 font-display text-3xl text-foreground"
            >
              Archive
            </Link>
            <Link href="/signals" onClick={() => setMenuOpenAt(null)} className="border-b border-border py-5 font-display text-3xl text-foreground">
              Live signals
            </Link>
            <Link
              href="/advertise"
              onClick={() => setMenuOpenAt(null)}
              className="mt-auto flex h-12 items-center justify-center whitespace-nowrap bg-primary text-sm font-medium text-primary-foreground active:scale-[0.98]"
            >
              Advertise
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
