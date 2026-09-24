"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readRaw(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "{}";
  } catch {
    return "{}";
  }
}

function parse(raw: string): Record<string, boolean> {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return {};
    const flags: Record<string, boolean> = {};
    for (const [id, flag] of Object.entries(value)) {
      if (typeof flag === "boolean") flags[id] = flag;
    }
    return flags;
  } catch {
    return {};
  }
}

/** Per-browser boolean flags keyed by id, shared live across every component using the same key. */
export function useLocalFlags(key: string): [Record<string, boolean>, (id: string, value: boolean) => void] {
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => "{}");
  const flags = useMemo(() => parse(raw), [raw]);
  const setFlag = useCallback(
    (id: string, value: boolean) => {
      const next = { ...parse(readRaw(key)), [id]: value };
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        return;
      }
      listeners.forEach((listener) => listener());
    },
    [key],
  );
  return [flags, setFlag];
}
