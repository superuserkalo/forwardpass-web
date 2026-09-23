"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ.:*+=-/#%&";
const BIT_W = 6;
const BIT_H = 8;
const MAX_COLS = 768;
const MAX_ROWS = 160;
const QUALITY = 2;

type Grid = {
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
};

const SHADER = /* wgsl */ `
struct Params {
  time: f32,
  cols: f32,
  rows: f32,
  glyphs: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> glyphBits: array<u32>;
@group(0) @binding(2) var<storage, read> cells: array<u32>;

fn hash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453123);
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let grid = vec2f(params.cols, params.rows);
  let cellPos = floor(uv * grid);
  let local = uv * grid - cellPos;
  let id = u32(cellPos.y) * u32(params.cols) + u32(cellPos.x);
  if (id >= arrayLength(&cells)) {
    return vec4f(0.0);
  }

  let data = cells[id];
  let coverage = f32((data >> 24u) & 255u) / 255.0;
  let along = f32((data >> 16u) & 255u) / 255.0;
  let seed = f32(data & 65535u);
  let px = min(u32(local.x * 6.0), 5u);
  let py = min(u32(local.y * 8.0), 7u);

  let slow = floor(params.time * 0.5);
  let fast = floor(params.time * 2.2);

  let tc = fract(params.time / 8.0) * 8.0;
  let flight = 2.4;
  let front = tc / flight;

  var tick = fast;
  var lum = 0.0;
  if (coverage > 0.04) {
    tick = slow;
    let gate = step(hash(vec2f(seed, slow + 5.0)), coverage * 1.1);
    let lit = step(along, front);
    let age = max(0.0, tc - along * flight);
    let settle = exp(-age / 4.5);
    let offset = (along - front) * 5.0;
    let pulse = exp(-offset * offset) * step(front, 1.0);
    let shimmer = 0.8 + 0.2 * sin(params.time * 1.3 + seed * 0.4);
    lum = gate * lit * shimmer * (0.18 + 0.45 * settle + 0.6 * pulse);
  } else {
    let flick = 0.35 + 0.65 * hash(vec2f(seed, fast + 31.0));
    lum = 0.03 + 0.045 * flick;
  }

  let glyphCount = max(u32(params.glyphs), 1u);
  let glyph = u32(hash(vec2f(seed, tick)) * f32(glyphCount)) % glyphCount;
  let rowBits = glyphBits[glyph * 8u + py];
  let shade = f32((rowBits >> (5u - px)) & 1u);
  let alpha = min(shade * lum, 0.95);
  return vec4f(vec3f(0.93) * alpha, alpha);
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

function buildCells(grid: Grid): Uint32Array<ArrayBuffer> {
  const cells = new Uint32Array(MAX_COLS * MAX_ROWS);
  const width = Math.round(grid.cols * grid.cellW * QUALITY);
  const height = Math.round(grid.rows * grid.cellH * QUALITY);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return cells;

  const launch = { x: 0.3 * width, y: 0.92 * height };
  const land = { x: 0.96 * width, y: 0.22 * height };
  const apex = { x: 0.6 * width, y: 0.42 * height };
  const ctrl = {
    x: (4 * apex.x - launch.x - land.x) / 2,
    y: (4 * apex.y - launch.y - land.y) / 2,
  };

  const point = (u: number) => {
    const k = 1 - u;
    return {
      x: k * k * launch.x + 2 * k * u * ctrl.x + u * u * land.x,
      y: k * k * launch.y + 2 * k * u * ctrl.y + u * u * land.y,
    };
  };
  const normal = (u: number) => {
    const k = 1 - u;
    const tx = 2 * k * (ctrl.x - launch.x) + 2 * u * (land.x - ctrl.x);
    const ty = 2 * k * (ctrl.y - launch.y) + 2 * u * (land.y - ctrl.y);
    const len = Math.max(Math.hypot(tx, ty), 0.000001);
    return { x: -ty / len, y: tx / len };
  };

  const bodyStart = 0.62;
  const seams = 11;
  const radius = 0.12 * height;

  const bodyRadius = (u: number) => {
    const s = Math.min(Math.max((u - bodyStart) / (1 - bodyStart), 0), 1);
    return radius * Math.pow(Math.sin(Math.PI * s), 0.7);
  };

  const edgePoint = (u: number, side: number) => {
    const p = point(u);
    const n = normal(u);
    const r = bodyRadius(u);
    return { x: p.x + n.x * r * side, y: p.y + n.y * r * side };
  };

  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const streaks = 5;
  ctx.lineWidth = Math.max(2, 0.0028 * height);
  for (let k = 0; k < streaks; k += 1) {
    const offset = (k - (streaks - 1) / 2) * 0.024 * height;
    for (let i = 0; i < 48; i += 1) {
      const u0 = 0.03 + (i / 48) * 0.56;
      const u1 = 0.03 + ((i + 1) / 48) * 0.56;
      const from = point(u0);
      const to = point(u1);
      const n0 = normal(u0);
      const n1 = normal(u1);
      ctx.globalAlpha = 0.5 * Math.pow(u0 / 0.6, 1.7);
      ctx.beginPath();
      ctx.moveTo(from.x + n0.x * offset, from.y + n0.y * offset);
      ctx.lineTo(to.x + n1.x * offset, to.y + n1.y * offset);
      ctx.stroke();
    }
  }

  ctx.lineWidth = Math.max(2.5, 0.0035 * height);
  for (const side of [1, -1]) {
    ctx.globalAlpha = side > 0 ? 0.55 : 0.26;
    ctx.beginPath();
    for (let i = 0; i <= 60; i += 1) {
      const u = bodyStart + (i / 60) * (1 - bodyStart);
      const e = edgePoint(u, side);
      if (i === 0) ctx.moveTo(e.x, e.y);
      else ctx.lineTo(e.x, e.y);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 0.85;
  ctx.lineWidth = Math.max(3, 0.0045 * height);
  const lead = ((1 - bodyStart) / seams) * 0.8;
  for (let j = 0; j < seams; j += 1) {
    const u = bodyStart + ((j + 0.5) / seams) * (1 - bodyStart);
    const a = edgePoint(u + lead * 0.5, 1);
    const b = edgePoint(u - lead * 0.5, -1);
    const pm = point(u);
    const nm = normal(u);
    const mid = {
      x: pm.x + nm.y * lead * 0.85,
      y: pm.y - nm.x * lead * 0.85,
    };
    const cx = 2 * mid.x - (a.x + b.x) / 2;
    const cy = 2 * mid.y - (a.y + b.y) / 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(cx, cy, b.x, b.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const image = ctx.getImageData(0, 0, width, height).data;
  const blockW = grid.cellW * QUALITY;
  const blockH = grid.cellH * QUALITY;
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      let sum = 0;
      for (let y = 0; y < blockH; y += 1) {
        const py = Math.min(Math.floor(row * blockH + y), height - 1);
        for (let x = 0; x < blockW; x += 1) {
          const px = Math.min(Math.floor(col * blockW + x), width - 1);
          const i = (py * width + px) * 4;
          sum += (image[i + 3] / 255) * ((image[i] + image[i + 1] + image[i + 2]) / 765);
        }
      }
      const coverage = sum / (blockW * blockH);
      const cov = coverage < 0.05 ? 0 : Math.min(255, Math.round(coverage * 255));

      const cx = (col + 0.5) * blockW;
      const cy = (row + 0.5) * blockH;
      let bestU = 0;
      let bestD = Number.POSITIVE_INFINITY;
      for (let s = 0; s < 96; s += 1) {
        const u = s / 95;
        const p = point(u);
        const dx = p.x - cx;
        const dy = p.y - cy;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          bestU = u;
        }
      }

      const along = Math.round(bestU * 255);
      const seed = Math.floor(Math.random() * 65535);
      cells[row * grid.cols + col] = (((cov << 24) | (along << 16) | seed) >>> 0);
    }
  }
  return cells;
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
        const cells = storage(gpu, MAX_COLS * MAX_ROWS * 4, "read");

        let grid = measureGrid(canvas);
        cells.write(buildCells(grid));

        const field = effect(gpu, SHADER, {
          blend: "premultiplied",
          set: {
            params: {
              time: 0,
              cols: grid.cols,
              rows: grid.rows,
              glyphs: GLYPHS.length,
            },
            glyphBits,
            cells,
          },
        });

        canvasSurface.onResize(() => {
          grid = measureGrid(canvas);
          cells.write(buildCells(grid));
          field.set({ params: { cols: grid.cols, rows: grid.rows } });
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
