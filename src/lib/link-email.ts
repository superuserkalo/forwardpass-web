import { Resend } from "resend";
import { createLinkToken, type LinkPurpose } from "./link-token";

/** Repeated requests for the same link purpose are throttled per address. */
export const LINK_COOLDOWN_MS = 120_000;
const LINK_SENT_AT_KEYS: Record<LinkPurpose, string> = {
  verify: "last_verify_link_sent_at",
  signin: "last_signin_link_sent_at",
  unsubscribe: "last_unsubscribe_link_sent_at",
};
const LINK_TTL_MS: Record<LinkPurpose, number> = {
  verify: 86_400_000,
  signin: 1_800_000,
  unsubscribe: 90 * 86_400_000,
};

export type LinkTarget = {
  id: string;
  lastLinkSentAt: string | null;
  lastLinkSentByPurpose?: Partial<Record<LinkPurpose, string>>;
};

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Email service is not configured");
  return new Resend(key);
}

export function toLinkTarget(
  id: string,
  properties: Record<string, { value?: unknown } | undefined> | undefined,
): LinkTarget {
  const sentAt = properties?.last_link_sent_at?.value;
  const lastLinkSentByPurpose: Partial<Record<LinkPurpose, string>> = {};
  for (const purpose of ["verify", "signin", "unsubscribe"] as const) {
    const value = properties?.[LINK_SENT_AT_KEYS[purpose]]?.value;
    if (typeof value === "string" && Number.isFinite(Date.parse(value))) lastLinkSentByPurpose[purpose] = value;
  }
  return {
    id,
    lastLinkSentAt: typeof sentAt === "string" && sentAt ? sentAt : null,
    ...(Object.keys(lastLinkSentByPurpose).length ? { lastLinkSentByPurpose } : {}),
  };
}

export async function linkTarget(email: string): Promise<LinkTarget | null> {
  const { data, error } = await getResend().contacts.get({ email });
  if (error && error.name !== "not_found") throw new Error("Could not check contact");
  return data ? toLinkTarget(data.id, data.properties) : null;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
    return entities[character] ?? character;
  });

function linkUrl(purpose: LinkPurpose, token: string): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://theforwardpass.net";
  // Sign-in tokens ride in the fragment so they stay out of server logs and referrers.
  return purpose === "unsubscribe"
    ? `${site}/unsubscribe?token=${token}`
    : `${site}/preferences/open#token=${token}`;
}

const COPY: Record<LinkPurpose, { subject: string; heading: string; body: string; action: string; footer: string }> = {
  verify: {
    subject: "The Forward Pass: Confirm your email",
    heading: "One click to join.",
    body: "Confirm your email to join The Forward Pass: one issue a day on what's changing in AI engineering, covering the important models, agents, research, infrastructure and tools, with primary sources. You'll also set up your edition and start your 14 days of Personal. Nothing starts until you confirm.",
    action: "Confirm your email",
    footer: "Didn't sign up? Ignore this email and you won't be added.",
  },
  signin: {
    subject: "The Forward Pass: Your sign-in link",
    heading: "Sign in to your edition.",
    body: "Use the button below to open your reading brief on this device. The link works for 30 minutes.",
    action: "Open your edition",
    footer: "Didn't ask for this? Ignore this email and nothing happens.",
  },
  unsubscribe: {
    subject: "The Forward Pass: Confirm unsubscribe",
    heading: "Confirm you want to leave.",
    body: "Use the button below to stop receiving The Forward Pass. You can rejoin any time.",
    action: "Unsubscribe",
    footer: "Didn't ask for this? Ignore this email and you'll stay subscribed.",
  },
};

function linkEmailHtml(purpose: LinkPurpose, url: string): string {
  const copy = COPY[purpose];
  return `<div style="background:#0a0a0a;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:0 24px;color:#f5f5f5;">
    <p style="margin:0 0 32px;font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#a3a3a3;">The Forward Pass</p>
    <h1 style="margin:0 0 20px;font-size:26px;line-height:1.2;font-weight:normal;color:#f5f5f5;">${escapeHtml(copy.heading)}</h1>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#d4d4d4;">${escapeHtml(copy.body)}</p>
    <p style="margin:0 0 32px;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#f5f5f5;color:#0a0a0a;padding:14px 24px;font-size:14px;text-decoration:none;">${escapeHtml(copy.action)}</a></p>
    <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:12px;color:#737373;">Kaloyan, The Forward Pass</p>
    <p style="margin:32px 0 0;font-family:'Courier New',monospace;font-size:11px;color:#737373;">${escapeHtml(copy.footer)}</p>
  </div>
</div>`;
}

/** Emails a signed link unless the same purpose is cooling down. Failures stay private so callers answer identically for every address. */
export async function sendLinkEmail(purpose: LinkPurpose, email: string, target: LinkTarget): Promise<void> {
  try {
    const now = Date.now();
    // Legacy contacts keep their previous cooldown until a purpose-specific timestamp is recorded.
    const sentAt = target.lastLinkSentByPurpose ? target.lastLinkSentByPurpose[purpose] : target.lastLinkSentAt;
    const last = sentAt ? Date.parse(sentAt) : Number.NaN;
    if (Number.isFinite(last) && now - last < LINK_COOLDOWN_MS) return;
    const resend = getResend();
    // Record this purpose's cooldown before sending, retaining the overall timestamp for older code.
    const reserved = await resend.contacts.update({
      id: target.id,
      properties: {
        last_link_sent_at: new Date(now).toISOString(),
        [LINK_SENT_AT_KEYS[purpose]]: new Date(now).toISOString(),
      },
    });
    if (reserved.error) throw new Error(reserved.error.message);
    const url = linkUrl(purpose, createLinkToken(purpose, email, now, LINK_TTL_MS[purpose]));
    const copy = COPY[purpose];
    const { error } = await resend.emails.send({
      from: "The Forward Pass <news@theforwardpass.net>",
      to: [email],
      replyTo: "hello@withradian.com",
      subject: copy.subject,
      html: linkEmailHtml(purpose, url),
      text: `${copy.heading}\n\n${copy.body}\n\n${copy.action}: ${url}\n\n${copy.footer}\n\nKaloyan, The Forward Pass`,
    });
    if (error) throw new Error(error.message);
  } catch (error) {
    console.error(`Link email (${purpose}) failed`, error);
  }
}
