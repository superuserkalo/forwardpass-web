export function workosConfigured(): boolean {
  return Boolean(
    process.env.WORKOS_API_KEY &&
    process.env.WORKOS_CLIENT_ID &&
    process.env.WORKOS_COOKIE_PASSWORD &&
    process.env.WORKOS_COOKIE_PASSWORD.length >= 32 &&
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
  );
}

/** Only reader destinations can survive the sign-in round trip. */
export function authReturnPath(value: unknown, fallback = "/auth/complete"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return fallback;
  const url = new URL(value, "https://theforwardpass.net");
  return ["/welcome", "/preferences", "/agents", "/pricing", "/auth/complete"].includes(url.pathname)
    ? `${url.pathname}${url.search}`
    : fallback;
}
