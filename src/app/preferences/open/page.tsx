"use client";

import { useEffect, useRef } from "react";
import { z } from "zod";

const sessionSchema = z.object({ next: z.enum(["/welcome", "/preferences"]) });

export default function OpenPreferences() {
  const started = useRef(false);

  useEffect(() => {
    // Strict Mode runs effects twice in development. The first run strips the token from the URL, so a second run would find none.
    if (started.current) return;
    started.current = true;
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
    })
      .then(async (response) => (response.ok ? sessionSchema.parse(await response.json()).next : "/preferences"))
      .catch(() => "/preferences")
      .then((next) => window.location.replace(next));
  }, []);

  return <main className="mx-auto min-h-screen max-w-3xl px-5 py-24 text-muted-foreground">Opening your edition…</main>;
}
