"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function CollaboratePanel({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.push("/");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Collaborate with The Forward Pass"
      className="relative w-full border border-border bg-secondary/50 p-5 md:p-8"
    >
      <Link
        href="/"
        aria-label="Close"
        className="absolute right-4 top-4 flex size-9 items-center justify-center border border-border text-muted-foreground transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-foreground"
      >
        <X className="size-4" aria-hidden="true" />
      </Link>
      {children}
    </div>
  );
}
