import { agentEndpoint } from "@/lib/agent-client";
import { SITE_URL } from "@/lib/seo";
import { signalsMcpUrl } from "@/lib/signals";

// RFC 9727 API catalog: the MCP servers a client can connect to, each with where it is documented. A server whose address is not
// configured is left out rather than guessed.
export function GET() {
  const paid = agentEndpoint();
  const free = signalsMcpUrl(paid);
  const linkset = [
    ...(free ? [{ anchor: free, "service-doc": [{ href: `${SITE_URL}/signals#mcp`, type: "text/html" }], describedby: [{ href: `${SITE_URL}/llms.txt`, type: "text/plain" }] }] : []),
    ...(paid ? [{ anchor: paid, "service-doc": [{ href: `${SITE_URL}/agents`, type: "text/html" }], describedby: [{ href: `${SITE_URL}/llms.txt`, type: "text/plain" }] }] : []),
  ];
  return new Response(JSON.stringify({ linkset }, null, 2) + "\n", {
    headers: {
      "Content-Type": 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"; charset=utf-8',
      Link: `<${SITE_URL}/.well-known/api-catalog>; rel="api-catalog"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
