// Search, answer-engine and preview crawlers, plus plain HTTP clients that agents fetch pages with.
const CRAWLER_UA =
  /bot\b|bot\/|crawl|spider|slurp|preview|externalhit|externalagent|-User\/|Google-|GPTBot|ClaudeBot|Claude-|Perplexity|OAI-SearchBot|ChatGPT|CCBot|Bytespider|Amazonbot|Applebot|DuckDuck|YandexBot|Baiduspider|ia_archiver|curl\/|Wget|python-|httpx|aiohttp|axios|node-fetch|undici|Go-http-client|okhttp|Java\//i;

// Clients that do not run JavaScript only see streamed content inside hidden templates after the footer.
export function isCrawler(userAgent: string | null): boolean {
  return !userAgent || CRAWLER_UA.test(userAgent);
}
