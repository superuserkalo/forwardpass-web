// Content negotiation: does the Accept header ask for Markdown over HTML? Browsers never list
// text/markdown, so any weight on it that is at least HTML's means the client is an agent.
export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  let markdown = 0;
  let html = 0;
  for (const part of accept.toLowerCase().split(",")) {
    const [type, ...params] = part.split(";").map((piece) => piece.trim());
    const weight = params.find((param) => param.startsWith("q="));
    const q = weight === undefined ? 1 : Number.parseFloat(weight.slice(2));
    const value = Number.isNaN(q) ? 0 : q;
    if (type === "text/markdown") markdown = Math.max(markdown, value);
    else if (type === "text/html" || type === "application/xhtml+xml") html = Math.max(html, value);
  }
  return markdown > 0 && markdown >= html;
}
