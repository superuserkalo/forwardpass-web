import { agentEndpoint } from "@/lib/agent-client";
import { SITE_URL } from "@/lib/seo";
import { signalsMcpUrl } from "@/lib/signals";

// RFC 9727 API catalog: the MCP servers a client can connect to, each with where it is documented. A server whose address is not
// configured is left out rather than guessed.
export function GET() {
  const paid = agentEndpoint();
  const free = signalsMcpUrl(paid);
  const servers = [
    ...(free ? [{ href: free, doc: `${SITE_URL}/signals#mcp` }] : []),
    ...(paid ? [{ href: paid, doc: `${SITE_URL}/agents` }] : []),
  ];
  const guide = [{ href: `${SITE_URL}/llms.txt`, type: "text/plain" }];
  const linkset = servers.length
    ? [
        { anchor: `${SITE_URL}/.well-known/api-catalog`, item: servers.map((server) => ({ href: server.href })) },
        ...servers.map((server) => ({ anchor: server.href, "service-doc": [{ href: server.doc, type: "text/html" }], describedby: guide })),
      ]
    : [];
  return new Response(JSON.stringify({ linkset }, null, 2) + "\n", {
    headers: {
      "Content-Type": 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"; charset=utf-8',
      Link: `<${SITE_URL}/.well-known/api-catalog>; rel="api-catalog"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
