import { verifyLinkToken } from "./link-token";
import { createPreferencesToken, verifyPreferencesToken } from "./preferences-token";

const SESSION_MS = 30 * 86_400_000;

export type Session = {
  /** Value for the HTTP-only preferences cookie; the agent accepts it as a Bearer token. */
  cookie: string;
  maxAgeSeconds: number;
  next: "/welcome" | "/preferences";
  /** Set only for a confirmation link: the address whose owner just proved their inbox and may now be subscribed. */
  subscribeEmail: string | null;
};

/**
 * Turns an emailed link token into a browser session. Following the link is the
 * proof of inbox ownership, so a confirmation or sign-in link yields a fresh
 * 30-day session, while the longer-lived newsletter edit links keep their own expiry.
 */
export function exchangeLinkToken(token: string, now = Date.now()): Session | null {
  const edit = verifyPreferencesToken(token, now);
  if (edit) {
    return {
      cookie: token,
      maxAgeSeconds: Math.max(1, Math.floor((edit.expires - now) / 1000)),
      next: "/preferences",
      subscribeEmail: null,
    };
  }
  for (const [purpose, next] of [
    ["verify", "/welcome"],
    ["signin", "/preferences"],
  ] as const) {
    const link = verifyLinkToken(purpose, token, now);
    if (link) {
      return {
        cookie: createPreferencesToken(link.email, now, SESSION_MS),
        maxAgeSeconds: SESSION_MS / 1000,
        next,
        subscribeEmail: purpose === "verify" ? link.email : null,
      };
    }
  }
  return null;
}
