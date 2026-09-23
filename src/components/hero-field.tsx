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

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let centered = vec2f((uv.x - 0.5) * params.aspect, uv.y - 0.5);
  let p = centered * 2.6;
  let t = params.time * 0.05;

  let warp = vec2f(
    fbm(p + vec2f(t, t * 0.4)),
    fbm(p + vec2f(-t * 0.6, t) + vec2f(5.2, 1.3))
  );
  let field = fbm(p * 1.4 + warp * 1.6);

  // Topographic contour lines from the scalar field.
  let band = abs(fract(field * 10.0) - 0.5) * 2.0;
  let width = 0.34 + 0.18 * sin(params.time * 0.15);
  var line = 1.0 - smoothstep(0.0, width, band);
  line = pow(line, 1.6);

  let fade = smoothstep(0.85, 0.05, length(centered));
  let a = line * 0.3 * fade;
  return vec4f(vec3f(0.93) * a, a);
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
        // No adapter, or the device was refused — the hero simply stays flat.
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
        maskImage: "radial-gradient(120% 90% at 70% 45%, black 20%, transparent 78%)",
        WebkitMaskImage: "radial-gradient(120% 90% at 70% 45%, black 20%, transparent 78%)",
      }}
    />
  );
}
