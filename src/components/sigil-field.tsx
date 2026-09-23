"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

const GLYPHS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ.:*+=-/#%&";
const BIT_W = 6;
const BIT_H = 8;
const MAX_COLS = 768;
const MAX_ROWS = 80;
const WORDMARK_FULL = "THE FORWARD PASS";
const WORDMARK_SHORT = "FORWARD PASS";
const TRACKING = 0.04;
const WIDTH_BUDGET = 0.86;
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
  reveal: f32,
  cols: f32,
  rows: f32,
  mouseX: f32,
  mouseY: f32,
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
  let seed = f32(data & 16777215u);
  let px = min(u32(local.x * 6.0), 5u);
  let py = min(u32(local.y * 8.0), 7u);

  let slow = floor(params.time * 0.45);
  let fast = floor(params.time * 2.4);

  let aspect = (params.cols * 6.0) / max(params.rows * 8.0, 1.0);
  let delta = (uv - vec2f(params.mouseX, params.mouseY)) * vec2f(aspect, 1.0);
  let poke = exp(-length(delta) * 11.0);

  let isMark = coverage > 0.04;
  let boil = hash(vec2f(seed, slow + 5.0));
  let gate = step(boil, coverage * 1.08);
  let blip = step(0.985, hash(vec2f(seed, fast + 17.0)));
  let cellDelay = hash(vec2f(seed, 13.0));
  let markReveal = smoothstep(cellDelay * 0.5, cellDelay * 0.5 + 0.4, params.reveal);
  let fieldReveal = smoothstep(0.0, 0.4, params.reveal);

  var tick = fast;
  var lum = 0.0;
  if (isMark) {
    tick = slow + floor(poke * 3.0);
    let shimmer = 0.78 + 0.22 * sin(params.time * 1.5 + seed * 0.61);
    lum = gate * (0.6 * shimmer + blip * 0.7) * markReveal;
  } else {
    let band = 0.72 + 0.28 * sin(cellPos.x * 0.19 + params.time * 0.12);
    let flick = 0.35 + 0.65 * hash(vec2f(seed, fast + 31.0));
    lum = ((0.05 + 0.055 * flick) * band + blip * 0.2) * fieldReveal;
  }
  lum = clamp(lum + poke * 0.3, 0.0, 1.0);

  let glyphCount = max(u32(params.glyphs), 1u);
  let glyph = u32(hash(vec2f(seed, tick)) * f32(glyphCount)) % glyphCount;
  let rowBits = glyphBits[glyph * 8u + py];
  let shade = f32((rowBits >> (5u - px)) & 1u);
  let a = shade * lum;
  return vec4f(vec3f(0.93) * a, a);
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

function buildCells(grid: Grid, family: string): Uint32Array<ArrayBuffer> {
  const cells = new Uint32Array(MAX_COLS * MAX_ROWS);
  const width = Math.round(grid.cols * grid.cellW * QUALITY);
  const height = Math.round(grid.rows * grid.cellH * QUALITY);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return cells;

  const text = width / QUALITY >= 720 ? WORDMARK_FULL : WORDMARK_SHORT;
  ctx.font = `500 100px ${family}`;
  const tracking = 100 * TRACKING;
  const advances: Array<number> = [];
  let advance = 0;
  for (const character of text) {
    const measured = ctx.measureText(character).width;
    advances.push(measured);
    advance += measured + tracking;
  }
  advance -= tracking;

  const capProbe = ctx.measureText("H");
  const capEm = (capProbe.actualBoundingBoxAscent || 70) / 100;
  const textEm = advance / 100;
  const byWidth = (width * WIDTH_BUDGET) / textEm;
  const byHeight = (height * 0.62) / capEm;
  const size = Math.min(byWidth, byHeight);

  const cap = capEm * size;
  const startX = (width - textEm * size) / 2;
  const baseline = height / 2 + cap / 2;

  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `500 ${size}px ${family}`;
  let x = startX;
  for (let i = 0; i < text.length; i += 1) {
    ctx.fillText(text[i], x, baseline);
    x += (advances[i] / 100) * size + (tracking / 100) * size;
  }

  const image = ctx.getImageData(0, 0, width, height).data;
  const blockW = grid.cellW * QUALITY;
  const blockH = grid.cellH * QUALITY;
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      let sum = 0;
      for (let y = 0; y < blockH; y += 1) {
        const py = Math.min(Math.floor(row * blockH + y), height - 1);
        for (let x2 = 0; x2 < blockW; x2 += 1) {
          const px = Math.min(Math.floor(col * blockW + x2), width - 1);
          const i = (py * width + px) * 4;
          sum += (image[i + 3] / 255) * ((image[i] + image[i + 1] + image[i + 2]) / 765);
        }
      }
      const coverage = sum / (blockW * blockH);
      const cov = coverage < 0.05 ? 0 : Math.min(255, Math.round(coverage * 255));
      const seed = Math.floor(Math.random() * 0xffffff);
      cells[row * grid.cols + col] = (((cov << 24) | seed) >>> 0);
    }
  }
  return cells;
}

type SigilFieldProps = {
  bandRef: RefObject<HTMLDivElement | null>;
};

export function SigilField({ bandRef }: SigilFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<{ x: number; y: number }>({ x: -10, y: -10 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const band = bandRef.current;
    if (!canvas || !band) return;
    if (typeof navigator === "undefined" || !("gpu" in navigator)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let dispose: (() => void) | undefined;
    let inView = true;

    const observer = new IntersectionObserver((entries) => {
      inView = entries[0]?.isIntersecting ?? true;
    });
    observer.observe(band);

    const onPointerMove = (event: PointerEvent) => {
      const rect = band.getBoundingClientRect();
      pointer.current = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      };
    };
    const onPointerLeave = () => {
      pointer.current = { x: -10, y: -10 };
    };
    band.addEventListener("pointermove", onPointerMove);
    band.addEventListener("pointerleave", onPointerLeave);

    (async () => {
      try {
        const { init, effect, frameLoop, surface, clock, storage } = await import("vgpu");
        const gpu = await init();
        if (disposed) {
          gpu.dispose();
          return;
        }

        const displayFamily = readFont("--font-editorial") || "Georgia, serif";
        const glyphFamily = readFont("--font-technical") || "monospace";
        await Promise.all([
          document.fonts.load(`500 64px ${displayFamily}`),
          document.fonts.load(`600 64px ${glyphFamily}`),
        ]);
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

        let grid = measureGrid(band);
        cells.write(buildCells(grid, displayFamily));

        const sigil = effect(gpu, SHADER, {
          blend: "premultiplied",
          set: {
            params: {
              time: 0,
              reveal: 0,
              cols: grid.cols,
              rows: grid.rows,
              mouseX: -10,
              mouseY: -10,
              glyphs: GLYPHS.length,
            },
            glyphBits,
            cells,
          },
        });

        canvasSurface.onResize(() => {
          grid = measureGrid(band);
          cells.write(buildCells(grid, displayFamily));
          sigil.set({ params: { cols: grid.cols, rows: grid.rows } });
        });

        const time = clock(gpu);
        let revealStart: number | undefined;
        const loop = frameLoop(gpu, (frame) => {
          if (!inView) return;
          if (revealStart === undefined) revealStart = time.time;
          const reveal = Math.min((time.time - revealStart) / 1.8, 1);
          sigil.set({
            params: {
              time: time.time,
              reveal,
              mouseX: pointer.current.x,
              mouseY: pointer.current.y,
            },
          });
          frame.pass(canvasSurface, sigil);
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
      band.removeEventListener("pointermove", onPointerMove);
      band.removeEventListener("pointerleave", onPointerLeave);
      dispose?.();
    };
  }, [bandRef]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full transition-opacity duration-1000"
        style={{
          opacity: active ? 1 : 0,
          maskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
        }}
      />
      <div
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
          active ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="font-mono text-xs uppercase tracking-[0.5em] text-muted-foreground sm:text-sm">
          The Forward Pass
        </span>
      </div>
    </>
  );
}
