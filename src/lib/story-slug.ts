// A featured story's page slug, from its headline. Must match storySlug in the engine
// (forwardpass/src/lib/cover-images.ts), which links archive rows to these pages.
export function storySlug(headline: string): string {
  const slug = headline.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (slug.length <= 80) return slug || "story";
  const cut = slug.slice(0, 81);
  return cut.slice(0, cut.lastIndexOf("-") > 40 ? cut.lastIndexOf("-") : 80).replace(/-+$/g, "");
}
