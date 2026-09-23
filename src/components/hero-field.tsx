"use client";

import { useEffect, useRef, useState } from "react";

const SHADER = /* wgsl */ `
struct Params {
  time: f32,
  aspect: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

fn hash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453123);
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash(i);
  let b = hash(i + vec2f(1.0, 0.0));
  let c = hash(i + vec2f(0.0, 1.0));
  let d = hash(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(p: vec2f) -> f32 {
  var sum = 0.0;
  var amp = 0.5;
  var q = p;
  for (var i = 0; i < 5; i = i + 1) {
    sum = sum + amp * noise(q);
    q = q * 2.02;
    amp = amp * 0.5;
  }
  return sum;
}

fn bezier(p0: vec2f, p1: vec2f, p2: vec2f, u: f32) -> vec2f {
  let k = 1.0 - u;
  return k * k * p0 + 2.0 * k * u * p1 + u * u * p2;
}

fn bezierTangent(p0: vec2f, p1: vec2f, p2: vec2f, u: f32) -> vec2f {
  return 2.0 * (1.0 - u) * (p1 - p0) + 2.0 * u * (p2 - p1);
}

fn vortex(p: vec2f, c: vec2f, gamma: f32, core: f32) -> f32 {
  let d2 = dot(p - c, p - c);
  return 0.5 * gamma * log(d2 + core * core);
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let centered = vec2f((uv.x - 0.5) * params.aspect, uv.y - 0.5);
  let t = params.time * 0.05;

  let warp = vec2f(
    fbm(centered * 1.5 + vec2f(t, t * 0.4)),
    fbm(centered * 1.5 + vec2f(-t * 0.6, t) + vec2f(5.2, 1.3))
  );
  let base = centered.y + (warp.x + warp.y) * 0.08;
  var psi = base;

  let cycleTime = 12.0;
  let flight = 4.6;
  let cycle = params.time / cycleTime;
  let passIndex = floor(cycle);
  let tc = fract(cycle) * cycleTime;
  let front = clamp(tc / flight, 0.0, 1.0);
  let spin = params.time * 0.32;
  let vary = hash(vec2f(passIndex, 3.0));

  let a = params.aspect;
  let p0 = vec2f(-0.55 * a, 0.32);
  let p2 = vec2f(0.55 * a, 0.02);
  let p1 = vec2f(0.02 * a + (vary - 0.5) * 0.12, -0.5 - 0.15 * vary);

  for (var k = 0; k < 16; k = k + 1) {
    let uk = (f32(k) + 0.5) / 16.0;
    if (uk <= front) {
      let age = max(0.0, tc - uk * flight);
      let fadeK = exp(-age / 5.0);
      let jitter = hash(vec2f(f32(k), passIndex));
      let coil = cos(uk * 22.0 - spin + jitter * 0.9);
      let q = bezier(p0, p1, p2, uk);
      let tg = bezierTangent(p0, p1, p2, uk);
      let normal = vec2f(-tg.y, tg.x) / max(length(tg), 0.000001);
      let c = q + normal * 0.055 * coil + vec2f(0.05, -0.008) * age;
      psi = psi + vortex(centered, c, 0.045 * fadeK * (0.8 + 0.4 * jitter), 0.02);
    }
  }

  let activity = clamp(abs(psi - base) * 7.0, 0.0, 1.0);

  let band = abs(fract(psi * 30.0) - 0.5) * 2.0;
  let width = 0.34 + 0.18 * sin(params.time * 0.15);
  var line = 1.0 - smoothstep(0.0, width, band);
  line = pow(line, 1.6);

  let fade = smoothstep(0.85, 0.05, length(centered));
  var alpha = line * 0.3 * fade * (1.0 + 0.9 * activity);
  alpha = min(alpha, 0.42);
  return vec4f(vec3f(0.93) * alpha, alpha);
}
`;

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

    (async () => {
      try {
        const { init, effect, frameLoop, surface, clock } = await import("vgpu");
        const gpu = await init();
        if (disposed) {
          gpu.dispose();
          return;
        }
        const canvasSurface = surface(gpu, canvas, {
          dpr: [1, 2],
          alphaMode: "premultiplied",
          clearColor: [0, 0, 0, 0],
        });
        const aspect = () => canvasSurface.size[0] / Math.max(1, canvasSurface.size[1]);
        const field = effect(gpu, SHADER, {
          blend: "premultiplied",
          set: { params: { time: 0, aspect: aspect() } },
        });
        canvasSurface.onResize(() => field.set({ params: { aspect: aspect() } }));

        const time = clock(gpu);
        const loop = frameLoop(gpu, (frame) => {
          field.set({ params: { time: time.time } });
          frame.pass(canvasSurface, field);
        });

        setActive(true);
        dispose = () => {
          loop.stop();
          gpu.dispose();
        };
      } catch {
        // No adapter, or the device was refused, so the hero simply stays flat.
      }
    })();

    return () => {
      disposed = true;
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
        maskImage: "radial-gradient(140% 115% at 60% 52%, black 30%, transparent 88%)",
        WebkitMaskImage: "radial-gradient(140% 115% at 60% 52%, black 30%, transparent 88%)",
      }}
    />
  );
}
