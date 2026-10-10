import type { BeforeSendEvent } from "@vercel/analytics";

export function redactAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url);
    if (url.pathname.startsWith("/auth/") || /^\/preferences\/(open|session)\/?$/.test(url.pathname)) {
      return null;
    }
    // Reader links can contain email addresses, signed tokens and auth state.
    url.search = "";
    url.hash = "";
    return { ...event, url: url.toString() };
  } catch {
    return null;
  }
}
