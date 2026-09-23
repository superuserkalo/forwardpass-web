"use client";

import { useEffect, useRef, useState } from "react";
import { buildGlyphBits } from "@/lib/glyph-raster";
import {
  ARC_STRIDE,
  CANDIDATE_COUNT,
  MAX_ARCS,
  MAX_TOKENS,
  TRACE_ROWS,
  VOCAB,
  createModel,
  createRng,
  forward,
  sampleToken,
  tokenize,
  type ForwardTrace,
} from "@/lib/tiny-transformer";

const ROW_LABELS = ["input", "attn", "mlp", "attn", "mlp", "attn", "mlp", "logits"];
const PROMPTS = ["THE FORWARD PASS", "WHATS CHANGING", "AI ENGINEERING", "ONE ISSUE A DAY"];
const PASS_EVERY = 3.2;
const ROW_PITCH = 0.075;
const ROW_BASE = 0.9;
const MODEL = createModel(11);

const SHADER = /* wgsl */ `
struct Params {
  time: f32,
  passTime: f32,
  activeCol: f32,
  tCount: f32,
  maxCols: f32,
  glyphs: f32,
  aspect: f32,
  padLeft: f32,
  chosen: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> glyphBits: array<u32>;
@group(0) @binding(2) var<storage, read> tokens: array<u32>;
@group(0) @binding(3) var<storage, read> norms: array<f32>;
@group(0) @binding(4) var<storage, read> arcs: array<f32>;
@group(0) @binding(5) var<storage, read> candidates: array<f32>;

fn rowCenter(r: f32) -> f32 {
  return 0.9 - r * 0.075;
}

fn colCenter(c: f32) -> f32 {
  let x0 = params.padLeft;
  let x1 = params.aspect * 0.985;
  let pitch = (x1 - x0) / max(params.maxCols, 1.0);
  return x0 + (c + 0.5) * pitch;
}

fn tileGlyph(p: vec2f, center: vec2f, glyph: u32) -> f32 {
  let local = (p - center) / vec2f(0.0375, 0.05) + 0.5;
  if (local.x <= 0.0 || local.x >= 1.0 || local.y <= 0.0 || local.y >= 1.0) {
    return 0.0;
  }
  let px = min(u32(local.x * 6.0), 5u);
  let py = min(u32(local.y * 8.0), 7u);
  let rowBits = glyphBits[glyph * 8u + py];
  return f32((rowBits >> (5u - px)) & 1u);
}

fn segDist(p: vec2f, a: vec2f, b: vec2f) -> f32 {
  let ab = b - a;
  let s = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.000001), 0.0, 1.0);
  return length(p - (a + ab * s));
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = vec2f(uv.x * params.aspect, uv.y);
  let wave = params.time - params.passTime;
  let waveRow = wave * 3.0;
  var alpha = 0.0;

  let r = clamp(floor((0.9 - p.y) / 0.075 + 0.5), 0.0, 7.0);
  let ry = rowCenter(r);
  let pitch = (params.aspect * 0.985 - params.padLeft) / max(params.maxCols, 1.0);
  let c = clamp(floor((p.x - params.padLeft) / pitch), 0.0, params.maxCols - 1.0);
  let cx = colCenter(c);
  let insideRow = step(abs(p.y - ry), 0.026);

  if (c < params.tCount && insideRow > 0.5) {
    let glyph = tokens[u32(c)];
    let base = norms[u32(r) * u32(params.maxCols) + u32(c)];
    let isAct = 1.0 - step(0.5, abs(c - params.activeCol));
    let dRow = r - waveRow;
    let rowGlow = exp(-dRow * dRow / 2.2);
    let shimmer = 0.03 * sin(params.time * 1.4 + c * 0.7 + r);
    let settled = 0.14 + 0.3 * base + shimmer;
    let lit = (0.3 + 0.8 * base) * (0.22 + rowGlow);
    let lum = mix(settled, lit, isAct) + rowGlow * (0.06 + 0.15 * base) * (1.0 - isAct);
    alpha = alpha + tileGlyph(p, vec2f(cx, ry), glyph) * lum;
  }

  for (var i = 0; i < 12; i = i + 1) {
    let w = arcs[i * 4 + 2];
    if (w <= 0.0) {
      continue;
    }
    let fromX = colCenter(arcs[i * 4 + 0]);
    let toX = colCenter(arcs[i * 4 + 1]);
    let arcRow = arcs[i * 4 + 3];
    let ay = rowCenter(arcRow);
    let start = vec2f(fromX, ay);
    let finish = vec2f(toX, ay);
    let control = vec2f((fromX + toX) * 0.5, ay - 0.06);
    var closest = 1000.0;
    var prev = start;
    for (var s = 1u; s <= 8u; s = s + 1u) {
      let u = f32(s) / 8.0;
      let k = 1.0 - u;
      let point = k * k * start + 2.0 * k * u * control + u * u * finish;
      closest = min(closest, segDist(p, prev, point));
      prev = point;
    }
    let lw = 0.0028 + 0.005 * w;
    let dRowA = arcRow - waveRow;
    let gate = exp(-dRowA * dRowA / 1.6);
    alpha = alpha + exp(-(closest * closest) / (lw * lw)) * w * (0.35 + 1.1 * gate);
  }

  let endGate = smoothstep(6.2, 7.6, waveRow);
  let nextX = colCenter(min(params.tCount, params.maxCols - 1.0));
  for (var j = 0; j < 5; j = j + 1) {
    let glyph = u32(candidates[j * 2] + 0.5);
    let prob = candidates[j * 2 + 1];
    let center = vec2f(nextX + (f32(j) - 2.0) * 0.058, 0.13);
    let picked = 1.0 - step(0.5, abs(f32(j) - params.chosen));
    let lum = (0.2 + 0.75 * prob) * endGate + picked * endGate * (0.35 + 0.15 * sin(params.time * 7.0));
    alpha = alpha + tileGlyph(p, center, glyph) * max(lum, 0.0);
  }

  alpha = min(alpha, 0.95);
  return vec4f(vec3f(0.93) * alpha, alpha);
}
`;

function readFont(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function ForwardPassField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof navigator === "undefined" || !("gpu" in navigator)) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let dispose: (() => void) | undefined;
    let inView = true;

    const observer = new IntersectionObserver((entries) => {
      inView = entries[0]?.isIntersecting ?? true;
    });
    observer.observe(canvas);

    (async () => {
      try {
        const { init, effect, frame, frameLoop, surface, clock, storage } = await import("vgpu");
        const gpu = await init();
        if (disposed) {
          gpu.dispose();
          return;
        }

        const glyphFamily = readFont("--font-technical") || "monospace";
        await document.fonts.load(`600 64px ${glyphFamily}`);
        if (disposed) {
          gpu.dispose();
          return;
        }

        const canvasSurface = surface(gpu, canvas, {
          dpr: [1, 2],
          alphaMode: "premultiplied",
          clearColor: [0, 0, 0, 0],
        });

        const glyphBits = storage(gpu, VOCAB.length * 8 * 4, "read");
        glyphBits.write(buildGlyphBits(glyphFamily, VOCAB));
        const tokensBuffer = storage(gpu, MAX_TOKENS * 4, "read");
        const normsBuffer = storage(gpu, TRACE_ROWS * MAX_TOKENS * 4, "read");
        const arcsBuffer = storage(gpu, MAX_ARCS * ARC_STRIDE * 4, "read");
        const candidatesBuffer = storage(gpu, CANDIDATE_COUNT * 2 * 4, "read");

        const aspect = () => canvas.clientWidth / Math.max(1, canvas.clientHeight);
        const padLeft = () => 88 / Math.max(1, canvas.clientHeight);
        const field = effect(gpu, SHADER, {
          blend: "premultiplied",
          set: {
            params: {
              time: 0,
              passTime: -10,
              activeCol: 0,
              tCount: 0,
              maxCols: MAX_TOKENS,
              glyphs: VOCAB.length,
              aspect: aspect(),
              padLeft: padLeft(),
              chosen: -1,
            },
            glyphBits,
            tokens: tokensBuffer,
            norms: normsBuffer,
            arcs: arcsBuffer,
            candidates: candidatesBuffer,
          },
        });

        canvasSurface.onResize(() => {
          field.set({ params: { aspect: aspect(), padLeft: padLeft() } });
        });

        const rng = createRng(97);
        const tokenScratch = new Uint32Array(MAX_TOKENS);
        let promptIndex = 0;
        let seq = tokenize(PROMPTS[0]);
        let promptChars = PROMPTS[0];

        const runPass = (now: number) => {
          const trace: ForwardTrace = forward(MODEL, seq);
          tokenScratch.fill(0);
          tokenScratch.set(trace.tokens);
          tokensBuffer.write(tokenScratch);
          normsBuffer.write(trace.norms);
          arcsBuffer.write(trace.arcs);
          candidatesBuffer.write(trace.candidates);

          const next = sampleToken(trace.candidates, rng);
          let chosen = -1;
          for (let i = 0; i < CANDIDATE_COUNT; i += 1) {
            if (Math.round(trace.candidates[i * 2]) === next) chosen = i;
          }

          if (seq.length >= MAX_TOKENS) {
            promptIndex = (promptIndex + 1) % PROMPTS.length;
            promptChars = PROMPTS[promptIndex];
            seq = tokenize(promptChars);
          } else {
            const grown = new Uint32Array(seq.length + 1);
            grown.set(seq);
            grown[seq.length] = next;
            seq = grown;
          }

          field.set({
            params: {
              passTime: now,
              activeCol: trace.tokens.length - 1,
              tCount: trace.tokens.length,
              chosen,
            },
          });
        };

        const time = clock(gpu);
        if (reduceMotion) {
          runPass(1);
          field.set({ params: { time: 2.4 } });
          frame(gpu, (single) => {
            single.pass(canvasSurface, field);
          });
          setActive(true);
          dispose = () => {
            gpu.dispose();
          };
          return;
        }

        let lastPass = -10;
        const loop = frameLoop(gpu, (current) => {
          if (!inView) return;
          const now = time.time;
          if (now - lastPass > PASS_EVERY) {
            runPass(now);
            lastPass = now;
          }
          field.set({ params: { time: now } });
          current.pass(canvasSurface, field);
        });

        setActive(true);
        dispose = () => {
          loop.stop();
          gpu.dispose();
        };
      } catch {
        setActive(false);
      }
    })();

    return () => {
      disposed = true;
      observer.disconnect();
      dispose?.();
    };
  }, []);

  return (
    <div className="relative h-[320px] w-full overflow-hidden border-t border-border md:h-[380px]">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full transition-opacity duration-1000"
        style={{ opacity: active ? 1 : 0 }}
      />
      {ROW_LABELS.map((label, index) => (
        <span
          key={`${label}-${index}`}
          className="pointer-events-none absolute left-4 -translate-y-1/2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
          style={{ top: `${(ROW_BASE - index * ROW_PITCH) * 100}%` }}
        >
          {label}
        </span>
      ))}
      <span
        className="pointer-events-none absolute left-4 -translate-y-1/2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
        style={{ top: "13%" }}
      >
        next token
      </span>
    </div>
  );
}
