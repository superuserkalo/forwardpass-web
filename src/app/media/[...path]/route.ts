import { archiveRequest } from "@/lib/archive-client";

const PATHS = [
  /^story\/\d{4}-\d{2}-\d{2}\/s-[a-f0-9]{16}$/,
  /^editorial\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  /^daily\/\d{4}-\d{2}-\d{2}$/,
];
const TYPES = new Set(["image/webp", "image/png", "image/jpeg"]);

// Story and article images from the engine. They never change once stored, so the CDN keeps them for a year.
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  if (!PATHS.some((pattern) => pattern.test(path))) return new Response("Not found", { status: 404 });
  const upstream = await archiveRequest(`/images/${path}`, undefined, { anonymous: true });
  const type = upstream?.headers.get("content-type") ?? "";
  if (!upstream?.ok || !TYPES.has(type)) return new Response("Not found", { status: upstream?.status === 404 ? 404 : 502 });
  return new Response(upstream.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
