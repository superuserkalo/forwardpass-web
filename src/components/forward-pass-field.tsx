"use client";

import { useEffect, useRef, useState } from "react";
import { buildGlyphBits } from "@/lib/glyph-raster";
import {
  EDGES_PER_GAP,
  STAGES,
  STAGE_NODES,
  VOCAB,
  createModel,
  edgeMatrix,
  forward,
  tokenize,
} from "@/lib/tiny-transformer";

const PROMPTS = ["THE FORWARD PASS", "WHATS CHANGING", "AI ENGINEERING", "ONE ISSUE A DAY"];
const PASS_EVERY = 3.4;
const MODEL = createModel(11);

const SHADER = /* wgsl */ `
struct Params {
  time: f32,
  passTime: f32,
  aspect: f32,
  glyphs: f32,
  cols: f32,
  rows: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> glyphBits: array<u32>;
@group(0) @binding(2) var<storage, read> acts: array<f32>;
@group(0) @binding(3) var<storage, read> edges: array<f32>;

fn hash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453123);
}

fn stageX(s: f32) -> f32 {
  return mix(-0.34 * params.aspect, 0.52 * params.aspect, s / 4.0);
}

fn nodePos(s: f32, i: f32) -> vec2f {
  let jitter = vec2f(
    (hash(vec2f(s * 7.1 + 3.0, i * 3.3)) - 0.5) * 0.03,
    (hash(vec2f(s * 5.7, i * 9.1 + 1.0)) - 0.5) * 0.05
  );
  return vec2f(stageX(s), (i / 11.0 - 0.5) * 0.62 - 0.02) + jitter;
}

fn segDist(p: vec2f, a: vec2f, b: vec2f) -> f32 {
  let ab = b - a;
  let s = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.000001), 0.0, 1.0);
  return length(p - (a + ab * s));
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let c = vec2f((uv.x - 0.5) * params.aspect, uv.y - 0.5);

  let grid = vec2f(params.cols, params.rows);
  let cellPos = floor(uv * grid);
  let local = uv * grid - cellPos;
  let px = min(u32(local.x * 6.0), 5u);
  let py = min(u32(local.y * 8.0), 7u);
  let seed = hash(cellPos);
  let fast = floor(params.time * 2.2);
  let flick = 0.35 + 0.65 * hash(vec2f(seed * 91.7, fast + 31.0));
  let glyphCount = max(u32(params.glyphs), 1u);
  let glyph = u32(hash(vec2f(seed, fast)) * f32(glyphCount)) % glyphCount;
  let rowBits = glyphBits[glyph * 8u + py];
  let shade = f32((rowBits >> (5u - px)) & 1u);
  var alpha = shade * (0.028 + 0.042 * flick);

  let x0 = stageX(0.0);
  let x1 = stageX(4.0);
  let span = x1 - x0;
  let elapsed = params.time - params.passTime;
  let live = step(elapsed, 1.6);
  let progress = clamp(elapsed / 1.6, 0.0, 1.0);
  let frontX = x0 - 0.05 + progress * (span + 0.1);

  let gap = clamp(floor((c.x - x0) / (span * 0.25)), 0.0, 3.0);
  for (var j = 0; j < 36; j = j + 1) {
    let slot = (u32(gap) * 36u + u32(j)) * 4u;
    let fromI = edges[slot];
    let toI = edges[slot + 1u];
    let w = edges[slot + 2u];
    if (w <= 0.0) {
      continue;
    }
    let a = nodePos(gap, fromI);
    let b = nodePos(gap + 1.0, toI);
    let d = segDist(c, a, b);
    let mid = (a.x + b.x) * 0.5;
    let dx = (mid - frontX) * 8.0;
    let front = exp(-dx * dx) * live;
    let lw = 0.0016 + 0.0022 * w;
    alpha = alpha + exp(-(d * d) / (lw * lw)) * (0.04 + 0.16 * w + 0.5 * front * w);
  }

  for (var s = 0; s < 5; s = s + 1) {
    for (var i = 0; i < 12; i = i + 1) {
      let pos = nodePos(f32(s), f32(i));
      let delta = c - pos;
      let d2 = dot(delta, delta);
      if (d2 > 0.004) {
        continue;
      }
      let act = acts[s * 12 + i];
      let nx = (pos.x - frontX) * 8.0;
      let surge = exp(-nx * nx) * live;
      let lum = 0.22 + 0.5 * act + 0.6 * surge;
      alpha = alpha + exp(-d2 / 0.00004) * lum + exp(-d2 / 0.0015) * 0.08 * lum;
    }
  }

  alpha = min(alpha, 0.85);
  return vec4f(vec3f(0.93) * alpha, alpha);
}
`;

function readFont(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function measureGrid(element: HTMLElement): { cols: number; rows: number } {
  const width = element.clientWidth;
  const height = element.clientHeight;
  const small = width < 720;
  return {
    cols: Math.max(1, Math.floor(width / (small ? 4.5 : 6))),
    rows: Math.max(1, Math.floor(height / (small ? 6 : 8))),
  };
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
        const actsBuffer = storage(gpu, STAGES * STAGE_NODES * 4, "read");
        actsBuffer.write(new Float32Array(STAGES * STAGE_NODES));
        const edgesBuffer = storage(gpu, (STAGES - 1) * EDGES_PER_GAP * 4, "read");
        edgesBuffer.write(edgeMatrix(MODEL));

        const aspect = () => canvas.clientWidth / Math.max(1, canvas.clientHeight);
        let grid = measureGrid(canvas);
        const field = effect(gpu, SHADER, {
          blend: "premultiplied",
          set: {
            params: {
              time: 0,
              passTime: -10,
              aspect: aspect(),
              glyphs: VOCAB.length,
              cols: grid.cols,
              rows: grid.rows,
            },
            glyphBits,
            acts: actsBuffer,
            edges: edgesBuffer,
          },
        });

        canvasSurface.onResize(() => {
          grid = measureGrid(canvas);
          field.set({
            params: { aspect: aspect(), cols: grid.cols, rows: grid.rows },
          });
        });

        let promptIndex = 0;
        let seq = tokenize(PROMPTS[0]);
        let position = 0;
        const runPass = (now: number) => {
          const trace = forward(MODEL, seq, position);
          actsBuffer.write(trace.stages);
          position += 1;
          if (position >= seq.length) {
            position = 0;
            promptIndex = (promptIndex + 1) % PROMPTS.length;
            seq = tokenize(PROMPTS[promptIndex]);
          }
          field.set({ params: { passTime: now } });
        };

        const time = clock(gpu);
        if (reduceMotion) {
          runPass(1);
          field.set({ params: { time: 2 } });
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
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full transition-opacity duration-1000"
      style={{
        opacity: active ? 1 : 0,
        maskImage: "radial-gradient(135% 115% at 62% 50%, black 32%, transparent 88%)",
        WebkitMaskImage: "radial-gradient(135% 115% at 62% 50%, black 32%, transparent 88%)",
      }}
    />
  );
}
