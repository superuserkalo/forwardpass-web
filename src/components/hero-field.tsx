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

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let centered = vec2f((uv.x - 0.5) * params.aspect, uv.y - 0.5);
  let p = centered * 2.6;
  let t = params.time * 0.05;

  let haze = 1.0 - smoothstep(0.25, 1.15, length(centered));
  let cycle = params.time * 0.085;
  let passIndex = floor(cycle);
  let phase = fract(cycle);
  let vary = hash(vec2f(passIndex, 7.0));
  let trailLen = 0.35;
  let lead = min(phase / 0.45, 1.0 + trailLen);

  let arc0 = vec2f(-0.45 * params.aspect, 0.42);
  let arc2 = vec2f(0.52 * params.aspect, 0.12);
  let arc1 = vec2f(0.05 * params.aspect + (vary - 0.5) * 0.18, -0.75 - 0.2 * vary);

  var stir = vec2f(0.0);
  var wake = 0.0;
  var chalk = 0.0;

  if (haze > 0.002) {
    let startU = clamp(lead - trailLen, 0.0, 1.0);
    let endU = min(lead, 1.0);
    var bestD = 1000.0;
    var bestU = 0.0;
    if (endU > startU + 0.0005) {
      let steps = 48u;
      var prevU = startU;
      var prevQ = bezier(arc0, arc1, arc2, startU);
      for (var i = 1u; i <= steps; i = i + 1u) {
        let u = mix(startU, endU, f32(i) / f32(steps));
        let q = bezier(arc0, arc1, arc2, u);
        let ab = q - prevQ;
        let s = clamp(dot(centered - prevQ, ab) / max(dot(ab, ab), 0.000001), 0.0, 1.0);
        let closest = prevQ + ab * s;
        let d = length(centered - closest);
        if (d < bestD) {
          bestD = d;
          bestU = mix(prevU, u, s);
        }
        prevU = u;
        prevQ = q;
      }
    }

    let age = clamp((lead - bestU) / trailLen, 0.0, 1.0);
    let along = (1.0 - age) * (1.0 - age);
    let tangent = bezierTangent(arc0, arc1, arc2, bestU);
    let normal = vec2f(-tangent.y, tangent.x) / max(length(tangent), 0.000001);
    let helix = sin(bestU * 110.0);

    wake = exp(-(bestD * bestD) / 0.00028) * along * haze;
    let core = exp(-(bestD * bestD) / (0.00005 * (1.0 + age * 2.0)));
    chalk = core * along * (0.6 + 0.4 * helix) * haze * 0.24;
    stir = normal * helix * wake * 0.6;
  }

  let warp = vec2f(
    fbm(p + vec2f(t, t * 0.4)),
    fbm(p + vec2f(-t * 0.6, t) + vec2f(5.2, 1.3))
  );
  let field = fbm(p * 1.4 + warp * 1.6 + stir);

  // Topographic contour lines from the scalar field.
  let band = abs(fract(field * 10.0) - 0.5) * 2.0;
  let width = 0.34 + 0.18 * sin(params.time * 0.15);
  var line = 1.0 - smoothstep(0.0, width, band);
  line = pow(line, 1.6);

  let fade = smoothstep(0.85, 0.05, length(centered));
  var alpha = line * 0.3 * fade * (1.0 + 1.2 * wake) + chalk;
  alpha = min(alpha, 0.45);
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
