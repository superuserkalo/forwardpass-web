"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: "auto";
      appearance: "interaction-only";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile unavailable")));
    script.onerror = () => {
      loading = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * Cloudflare Turnstile bot check. Invisible unless Cloudflare needs the visitor
 * to interact. Tokens are single-use, so bump `resetKey` after every submission
 * attempt to fetch a fresh one.
 */
export function TurnstileWidget({
  action,
  onToken,
  onError,
  resetKey,
}: {
  action: "signup" | "signin" | "unsubscribe" | "contact";
  onToken: (token: string | null) => void;
  onError?: () => void;
  resetKey: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const latestOnToken = useRef(onToken);
  const latestOnError = useRef(onError);

  useEffect(() => {
    latestOnToken.current = onToken;
    latestOnError.current = onError;
  });

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const element = container.current;
    if (!siteKey || !element) {
      console.error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is not configured.");
      latestOnError.current?.();
      return;
    }
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled) return;
        widgetId.current = api.render(element, {
          sitekey: siteKey,
          action,
          theme: "auto",
          appearance: "interaction-only",
          callback: (token) => latestOnToken.current(token),
          "expired-callback": () => latestOnToken.current(null),
          "error-callback": () => {
            latestOnToken.current(null);
            latestOnError.current?.();
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        latestOnToken.current(null);
        latestOnError.current?.();
      });
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [action]);

  useEffect(() => {
    if (resetKey > 0 && widgetId.current) window.turnstile?.reset(widgetId.current);
  }, [resetKey]);

  return <div ref={container} className="mt-3" />;
}
