"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ.:*+=-/#%&";
const BIT_W = 6;
const BIT_H = 8;
const MAX_COLS = 768;
const MAX_ROWS = 160;

type Grid = {
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
};

const SHADER = /* wgsl */ `
struct Params {
  time: f32,
  aspect: f32,
  cols: f32,
  rows: f32,
  glyphs: f32,
}

struct Shot {
  pos: vec2f,
  tilt: f32,
  spin: f32,
  tt: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> glyphBits: array<u32>;

fn hash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453123);
}

fn shotAt(t: f32) -> Shot {
  let release = vec2f(-0.56 * params.aspect, 0.44);
  let catchPos = vec2f(0.52 * params.aspect, -0.14);
  let flightTime = 3.6;
  let tt = t / flightTime;
  let arc = 0.42;
  let pos = mix(release, catchPos, tt) + vec2f(0.0, -arc * 4.0 * tt * (1.0 - tt));
  let vel = (catchPos - release) / flightTime + vec2f(0.0, -arc * 4.0 * (1.0 - 2.0 * tt) / flightTime);
  let tilt = atan2(vel.y, vel.x) + 0.05 * sin(t * 3.1);
  let spin = t * 4.8 + 0.35 * sin(t * 2.3);
  return Shot(pos, tilt, spin, tt);
}

fn ballLayer(c: vec2f, t: f32, ghost: f32) -> vec4f {
  let s = shotAt(t);
  if (s.tt <= 0.0 || s.tt >= 1.0) {
    return vec4f(0.0);
  }
  let life = smoothstep(0.0, 0.03, s.tt) * (1.0 - smoothstep(0.86, 1.0, s.tt));
  let scale = 1.0 + 0.12 * s.tt;
  let major = 0.11 * scale;
  let minor = 0.05 * scale;
  let rel = c - s.pos;
  let ct = cos(-s.tilt);
  let st = sin(-s.tilt);
  let local = vec2f(rel.x * ct - rel.y * st, rel.x * st + rel.y * ct);
  let q = vec2f(local.x / major, local.y / minor);
  let r2 = dot(q, q);

  if (r2 >= 1.0) {
    let d = sqrt(r2);
    let halo = exp(-(d - 1.0) * 7.0) * 0.04 * life * ghost;
    return vec4f(vec3f(0.93) * halo, halo);
  }

  let z = sqrt(1.0 - r2);
  let cs = cos(s.spin);
  let sn = sin(s.spin);
  let oy = q.y * cs - z * sn;
  let oz = q.y * sn + z * cs;
  let angle = atan2(oz, oy);

  let ridge = 0.5 + 0.5 * sin(angle * 2.0 + q.x * 7.85);
  let seam = pow(ridge, 18.0);

  let laceZone = smoothstep(0.88, 0.97, cos(angle)) * (1.0 - smoothstep(0.36, 0.46, abs(q.x)));
  let laceBars = 1.0 - smoothstep(0.08, 0.18, abs(fract(q.x * 11.0) - 0.5));
  let lace = laceZone * (0.55 + 0.45 * laceBars);

  let nrm = normalize(vec3f(q, z));
  let key = 0.5 + 0.5 * dot(nrm, normalize(vec3f(-0.5, -0.7, 0.6)));
  let rim = pow(1.0 - z, 3.0);

  var lum = 0.05 + 0.06 * key + 0.26 * rim;
  lum = lum + seam * 0.42 + lace * 0.5;

  let edge = 1.0 - smoothstep(0.94, 1.0, r2);
  let alpha = min(lum, 1.0) * edge * life * ghost;
  return vec4f(vec3f(0.93) * alpha, alpha);
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
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
  let fieldAlpha = shade * (0.028 + 0.042 * flick);

  var acc = vec4f(vec3f(0.93) * fieldAlpha, fieldAlpha);

  let c = vec2f((uv.x - 0.5) * params.aspect, uv.y - 0.5);
  let tc = fract(params.time / 9.0) * 9.0;

  let g1 = ballLayer(c, tc - 0.1, 0.22);
  acc = g1 + acc * (1.0 - g1.a);
  let g2 = ballLayer(c, tc - 0.2, 0.14);
  acc = g2 + acc * (1.0 - g2.a);
  let g3 = ballLayer(c, tc - 0.3, 0.08);
  acc = g3 + acc * (1.0 - g3.a);
  let ball = ballLayer(c, tc, 1.0);
  acc = ball + acc * (1.0 - ball.a);

  return acc;
}
`;

function readFont(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function measureGrid(element: HTMLElement): Grid {
  const width = element.clientWidth;
  const height = element.clientHeight;
  const small = width < 720;
  const cellW = small ? 4.5 : 6;
  const cellH = small ? 6 : 8;
  return {
    cols: Math.max(1, Math.min(MAX_COLS, Math.floor(width / cellW))),
    rows: Math.max(1, Math.min(MAX_ROWS, Math.floor(height / cellH))),
    cellW,
    cellH,
  };
}

function buildGlyphBits(family: string): Uint32Array<ArrayBuffer> {
  const scale = 8;
  const cellW = BIT_W * scale;
  const cellH = BIT_H * scale;
  const strip = document.createElement("canvas");
  strip.width = GLYPHS.length * cellW;
  strip.height = cellH;
  const ctx = strip.getContext("2d", { willReadFrequently: true });
  const bits = new Uint32Array(GLYPHS.length * BIT_H);
  if (!ctx) return bits;

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${Math.round(cellH * 0.78)}px ${family}`;
  for (let i = 0; i < GLYPHS.length; i += 1) {
    ctx.fillText(GLYPHS[i], i * cellW + cellW / 2, cellH / 2);
  }

  const image = ctx.getImageData(0, 0, strip.width, strip.height).data;
  for (let i = 0; i < GLYPHS.length; i += 1) {
    for (let y = 0; y < BIT_H; y += 1) {
      let row = 0;
      for (let x = 0; x < BIT_W; x += 1) {
        let alpha = 0;
        for (let sy = 0; sy < scale; sy += 1) {
          for (let sx = 0; sx < scale; sx += 1) {
            const px = i * cellW + x * scale + sx;
            const py = y * scale + sy;
            alpha += image[(py * strip.width + px) * 4 + 3];
          }
        }
        if (alpha / (scale * scale * 255) > 0.3) {
          row |= 1 << (BIT_W - 1 - x);
        }
      }
      bits[i * BIT_H + y] = row;
    }
  }
  return bits;
}

export function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof navigator === "undefined" || !("gpu" in navigator)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let dispose: (() => void) | undefined;
    let inView = true;

    const observer = new IntersectionObserver((entries) => {
      inView = entries[0]?.isIntersecting ?? true;
    });
    observer.observe(canvas);

    (async () => {
      try {
        const { init, effect, frameLoop, surface, clock, storage } = await import("vgpu");
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

        const glyphBits = storage(gpu, GLYPHS.length * BIT_H * 4, "read");
        glyphBits.write(buildGlyphBits(glyphFamily));

        let grid = measureGrid(canvas);
        const aspect = () => canvas.clientWidth / Math.max(1, canvas.clientHeight);
        const field = effect(gpu, SHADER, {
          blend: "premultiplied",
          set: {
            params: {
              time: 0,
              aspect: aspect(),
              cols: grid.cols,
              rows: grid.rows,
              glyphs: GLYPHS.length,
            },
            glyphBits,
          },
        });

        canvasSurface.onResize(() => {
          grid = measureGrid(canvas);
          field.set({
            params: { aspect: aspect(), cols: grid.cols, rows: grid.rows },
          });
        });

        const time = clock(gpu);
        const loop = frameLoop(gpu, (frame) => {
          if (!inView) return;
          field.set({ params: { time: time.time } });
          frame.pass(canvasSurface, field);
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
