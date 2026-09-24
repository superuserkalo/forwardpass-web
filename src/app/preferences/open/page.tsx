"use client";

import { useEffect } from "react";

export default function OpenPreferences() {
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    window.history.replaceState(null, "", "/preferences/open");
    if (!token) {
      window.location.replace("/preferences");
      return;
    }
    void fetch("/preferences/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      credentials: "same-origin",
      cache: "no-store",
    }).catch(() => null).finally(() => window.location.replace("/preferences"));
  }, []);

  return <main className="mx-auto min-h-screen max-w-3xl px-5 py-24 text-muted-foreground">Opening your reading brief…</main>;
}
