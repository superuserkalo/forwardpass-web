"use client";

import { Mail } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./hero-pipeline.module.css";

type Kind = "news" | "papers" | "models" | "repos";

type Sample = { kind: Kind; title: string; source: string; score: number };

// The weekly counts and the scores below are illustrative, not measurements.
const KINDS: Array<{ kind: Kind; tag: string; label: string; base: number }> = [
  { kind: "news", tag: "News", label: "News", base: 486 },
  { kind: "papers", tag: "Paper", label: "Papers", base: 1204 },
  { kind: "models", tag: "Model", label: "Models", base: 312 },
  { kind: "repos", tag: "Repo", label: "Repos", base: 845 },
];

// Real stories from the week of 28 September 2026, with headlines cut down to fit a row.
const STORIES: Array<Sample> = [
  { kind: "news", title: "Muse Spark helps solve five open maths problems", source: "Meta", score: 879 },
  { kind: "models", title: "GPT-6.1 Sol costs one-fifth of Astra’s API price", source: "OpenAI", score: 878 },
  { kind: "papers", title: "Context Language Models run their own context", source: "arXiv", score: 872 },
  { kind: "news", title: "Four Trillium TPUs reach low Earth orbit", source: "Google", score: 869 },
  { kind: "repos", title: "PageIndex swaps vector search for a document tree", source: "GitHub", score: 860 },
  { kind: "models", title: "Gemini 4 Argon cuts cached input prices by 95%", source: "Google", score: 856 },
  { kind: "news", title: "Prime Inference launches at 600B tokens a day", source: "Prime Intellect", score: 912 },
  { kind: "papers", title: "Agent Error Dataset lifts pass rates to 51.1%", source: "arXiv", score: 643 },
  { kind: "news", title: "Copilot adds computer use for desktop apps", source: "GitHub", score: 804 },
  { kind: "models", title: "AstaBrief 8B writes cited reports 3.5x faster", source: "Ai2", score: 437 },
  { kind: "repos", title: "Context Mode cuts agent context use by 98%", source: "GitHub", score: 728 },
  { kind: "news", title: "Gboard’s private training moves into enclaves", source: "Google Research", score: 771 },
  { kind: "models", title: "Ideogram 4.5 debuts for precision image edits", source: "Artificial Analysis", score: 392 },
  { kind: "papers", title: "EngiWorld tests engineering agents on 1,301 tasks", source: "Hugging Face", score: 552 },
  { kind: "news", title: "Cloudflare open-sources its Clef decision models", source: "Cloudflare", score: 835 },
  { kind: "repos", title: "Magnitude runs up to 2x faster than llama.cpp", source: "GitHub", score: 690 },
  { kind: "news", title: "FLUX.2-dev leads open image models at 66% wins", source: "Arena", score: 468 },
  { kind: "news", title: "Pi 1.0 ships with Codemode and native MCP", source: "Earendil", score: 741 },
  { kind: "news", title: "RCP-nDCG@10 scores every retrieved result", source: "Cohere", score: 324 },
  { kind: "news", title: "Apple to tighten macOS disk access for AI agents", source: "TechCrunch", score: 816 },
  { kind: "news", title: "Factory splits Droid spend by model and user", source: "Factory", score: 276 },
];

const CHANNELS: Array<{ id: string; name: string; logo?: string }> = [
  { id: "email", name: "Email" },
  { id: "slack", name: "Slack", logo: "slack" },
  { id: "discord", name: "Discord", logo: "discord" },
  { id: "telegram", name: "Telegram", logo: "telegram" },
];

const ROWS = 6;
const CYCLE_MS = 4200;
const FIRST_MS = 900;
// The row lands first, then the pulse leaves the feed.
const SEND_MS = 950;
const DASH_PX = 28;
const PX_PER_MS = 0.3;

type Wire = { id: string; d: string; length: number };
type Wiring = { width: number; height: number; x: number; y: number; wires: Array<Wire> };

/** The story in `row` after `tick` arrivals. Each tick puts the next story on top. */
function storyAt(tick: number, row: number): Sample {
  return STORIES[(tick + ROWS - 1 - row + STORIES.length) % STORIES.length];
}

/** How many stories of `kind` have arrived by `tick`. */
function arrivals(kind: Kind, tick: number): number {
  const lap = STORIES.length;
  let count = Math.floor(tick / lap) * STORIES.filter((story) => story.kind === kind).length;
  for (let step = tick - (tick % lap) + 1; step <= tick; step += 1) {
    if (storyAt(step, 0).kind === kind) count += 1;
  }
  return count;
}

export function HeroPipeline() {
  const rootRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [tick, setTick] = useState(0);
  const [wiring, setWiring] = useState<Wiring | null>(null);

  // Route a wire from the top row of the feed to each channel, in real pixels so the corners stay crisp.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(() => {
      const feed = feedRef.current;
      const rows = rowsRef.current;
      const box = root.getBoundingClientRect();
      if (!feed || !rows || box.width === 0) {
        setWiring(null);
        return;
      }
      const viewport = rows.getBoundingClientRect();
      const x = Math.round(feed.getBoundingClientRect().right - box.left);
      const y = Math.round(viewport.top - box.top + viewport.height / ROWS / 2) + 0.5;
      const wires: Array<Wire> = [];
      CHANNELS.forEach((channel, index) => {
        const node = nodeRefs.current[index]?.getBoundingClientRect();
        if (!node) return;
        const endX = Math.round(node.left - box.left);
        const endY = Math.round(node.top - box.top + node.height / 2) + 0.5;
        const turn = Math.round(x + (endX - x) / 2) + 0.5;
        wires.push({
          id: channel.id,
          d: `M${x} ${y}H${turn}V${endY}H${endX}`,
          length: endX - x + Math.abs(endY - y),
        });
      });
      setWiring({ width: Math.round(box.width), height: Math.round(box.height), x, y, wires });
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // Advance only while the hero is on screen and the tab is in front.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: number | undefined;
    let onScreen = false;
    const step = () => {
      setTick((current) => current + 1);
      timer = window.setTimeout(step, CYCLE_MS);
    };
    const sync = () => {
      const running = onScreen && !document.hidden;
      if (running && timer === undefined) timer = window.setTimeout(step, FIRST_MS);
      if (!running && timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    observer.observe(root);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.clearTimeout(timer);
    };
  }, []);

  const moving = tick > 0;
  // One row more than fits, so the outgoing story is still there while the list slides down.
  const rows = Array.from({ length: ROWS + 1 }, (_, row) => storyAt(tick, row));
  const arrived = moving ? rows[0].kind : null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={styles.pipeline}
      style={{ "--rows": ROWS, "--send": `${SEND_MS}ms`, "--dash": `${DASH_PX}px` } as CSSProperties}
    >
      <div ref={feedRef} className={styles.feed}>
        <p className={styles.eyebrow}>This week</p>
        <div className={styles.stats}>
          {KINDS.map(({ kind, label, base }) => {
            const count = base + arrivals(kind, tick);
            return (
              <div key={kind} className={styles.stat}>
                <span key={count} className={`${styles.count} ${arrived === kind ? styles.bumped : ""}`}>
                  {count.toLocaleString("en-US")}
                </span>
                <span className={styles.label}>{label}</span>
              </div>
            );
          })}
        </div>
        <div ref={rowsRef} className={styles.rows}>
          <div key={tick} className={moving ? styles.advance : undefined}>
            {rows.map((story, row) => (
              <div key={story.title} className={`${styles.row} ${moving && row === 0 ? styles.fresh : ""}`}>
                <span className={styles.score}>
                  <span className={styles.arrow} />
                  {story.score}
                </span>
                <span className={styles.kind}>{KINDS.find(({ kind }) => kind === story.kind)?.tag}</span>
                <span className={styles.title}>{story.title}</span>
                <span className={styles.source}>{story.source}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.channels}>
        {CHANNELS.map(({ id, name, logo }, index) => {
          const wire = wiring?.wires.find((candidate) => candidate.id === id);
          const lit = moving && wire !== undefined;
          return (
            <div
              key={`${id}-${tick}`}
              className={`${styles.channel} ${lit ? styles.lit : ""}`}
              style={wire ? ({ "--arrive": `${Math.round(SEND_MS + wire.length / PX_PER_MS)}ms` } as CSSProperties) : undefined}
            >
              <span
                ref={(element) => {
                  nodeRefs.current[index] = element;
                }}
                className={styles.node}
              >
                {logo ? (
                  <span className={styles.glyph} style={{ "--glyph": `url(/logos/${logo}.svg)` } as CSSProperties} />
                ) : (
                  <Mail className={styles.icon} strokeWidth={1.5} />
                )}
              </span>
              <span className={styles.name}>{name}</span>
            </div>
          );
        })}
      </div>

      {wiring ? (
        <svg className={styles.wires} width={wiring.width} height={wiring.height} viewBox={`0 0 ${wiring.width} ${wiring.height}`}>
          {wiring.wires.map((wire) => (
            <path key={wire.id} d={wire.d} className={styles.wire} />
          ))}
          {moving ? (
            <g key={tick}>
              {wiring.wires.map((wire) => (
                <path
                  key={wire.id}
                  d={wire.d}
                  className={styles.pulse}
                  style={
                    {
                      "--length": `${wire.length}px`,
                      "--travel": `${Math.round((wire.length + DASH_PX) / PX_PER_MS)}ms`,
                    } as CSSProperties
                  }
                />
              ))}
              <rect x={wiring.x - 2} y={wiring.y - 2.5} width={5} height={5} className={styles.port} />
            </g>
          ) : null}
        </svg>
      ) : null}
    </div>
  );
}
