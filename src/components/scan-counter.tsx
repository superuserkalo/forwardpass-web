"use client";

import { useEffect, useState } from "react";
import { scannedAt } from "@/lib/source-stats";

const DIGITS = Array.from({ length: 10 }, (_, digit) => digit);

function Digit({ value }: { value: number }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden leading-none">
      <span
        className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
        style={{ transform: `translateY(${-value}em)` }}
      >
        {DIGITS.map((digit) => (
          <span key={digit} className="block h-[1em] text-center leading-none">
            {digit}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Rolling digits sized by the surrounding text. `shown` is what the digits display, `label` is what assistive tech reads. */
function Odometer({ shown, label, hidden }: { shown: string; label: string; hidden?: boolean }) {
  return (
    <span
      className={`inline-block align-[-0.12em] font-mono leading-none tabular-nums text-foreground transition-opacity duration-700 ${
        hidden ? "opacity-0" : "opacity-100"
      }`}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="inline-flex items-end">
        {shown.split("").map((character, index) =>
          character === "," ? (
            <span key={`sep-${index}`} className="inline-block w-[0.3em]" />
          ) : (
            <Digit key={`d-${shown.length - index}`} value={Number(character)} />
          ),
        )}
      </span>
    </span>
  );
}

/** Items scanned so far. Derived from the clock, so it never restarts on reload. */
export function ScanCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setCount(scannedAt(Date.now()));
    update();
    const timer = setInterval(update, 500);
    return () => clearInterval(timer);
  }, []);

  const text = (count ?? 0).toLocaleString("en-US");
  return <Odometer shown={text} label={text} hidden={count === null} />;
}

/** A real count from the server. The digits roll in from zero once the page loads. */
export function RollingCount({ value }: { value: number }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const text = value.toLocaleString("en-US");
  return <Odometer shown={ready ? text : text.replace(/\d/g, "0")} label={text} />;
}
