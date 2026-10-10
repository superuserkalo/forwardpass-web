"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { ArchiveShellSkeleton } from "./archive/skeletons";
import { BrandLockup } from "./brand-lockup";
import styles from "./site-header.module.css";

const navigation = [
  { href: "/pricing", label: "Newsletter", mobileLabel: "Personal AI newsletter" },
  { href: "/archive", label: "Archive", mobileLabel: "Archive" },
  { href: "/signals", label: "Live signals", mobileLabel: "Live signals" },
];

export function SiteHeader() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
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
      if (event.key === "Escape") {
        setMenuOpenAt(null);
        menuButtonRef.current?.focus();
      }
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
      <div ref={sentinelRef} aria-hidden="true" className={styles.sentinel} />
      {menuOpen && <button type="button" className={styles.menuBackdrop} aria-label="Close navigation" tabIndex={-1} onClick={() => setMenuOpenAt(null)} />}
      <header className={styles.header} data-compact={scrolled} data-menu-open={menuOpen} onBlur={(event) => {
        if (menuOpen && !event.currentTarget.contains(event.relatedTarget)) setMenuOpenAt(null);
      }}>
        <div className={styles.pill}>
          <div className={styles.row}>
            <BrandLockup className={styles.brand} />
            <nav aria-label="Main" className={styles.desktopNav}>
              {navigation.map(({ href, label }) => (
                <Link key={href} href={href} onNavigate={href === "/archive" ? onArchiveNavigate : undefined} aria-current={pathname === href ? "page" : undefined} className={styles.navLink}>
                  {label}
                </Link>
              ))}
            </nav>
            <div className={styles.actions}>
              <Link href="/signin" onClick={() => setMenuOpenAt(null)} className={styles.signIn}>Sign in</Link>
              <Link href="/advertise" onClick={() => setMenuOpenAt(null)} className={styles.advertise}>Advertise</Link>
              <button
                ref={menuButtonRef}
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={() => setMenuOpenAt(menuOpen ? null : pathname)}
                className={styles.menuButton}
              >
                {menuOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
              </button>
            </div>
          </div>
          {menuOpen && (
            <nav id="mobile-menu" aria-label="Main" className={styles.mobileNav}>
              <p className={styles.menuLabel}>Explore Forward Pass</p>
              {navigation.map(({ href, mobileLabel }) => (
                <Link key={href} href={href} onNavigate={href === "/archive" ? onArchiveNavigate : undefined} onClick={() => setMenuOpenAt(null)} aria-current={pathname === href ? "page" : undefined} className={styles.mobileLink}>
                  {mobileLabel}<ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              ))}
              <Link href="/preferences" onClick={() => setMenuOpenAt(null)} className={styles.mobileAccount}>Your account<ArrowUpRight size={16} aria-hidden="true" /></Link>
            </nav>
          )}
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
