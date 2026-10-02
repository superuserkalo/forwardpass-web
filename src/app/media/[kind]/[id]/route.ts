import { archiveRequest } from "@/lib/archive-client";

const ID = { daily: /^\d{4}-\d{2}-\d{2}$/, editorial: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ } as const;
const TYPES = new Set(["image/webp", "image/png", "image/jpeg"]);

// Generated covers from the engine. They never change once drawn, so the CDN keeps them for a year.
export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if ((kind !== "daily" && kind !== "editorial") || !ID[kind].test(id)) return new Response("Not found", { status: 404 });
  const upstream = await archiveRequest(`/images/${kind}/${id}`, undefined, { anonymous: true });
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
