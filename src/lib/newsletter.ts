import { Resend } from "resend";
import { toLinkTarget, type LinkTarget } from "./link-email";

export const NEWSLETTER_SEGMENT = "2ec79559-e5f2-4a84-887b-5cee315656a3";
export const NEWSLETTER_TOPIC = "418f8071-0c80-4e3f-a076-b21ccfd40318";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Email service is not configured");
  return new Resend(key);
}

/**
 * Subscribes an address to the newsletter. Call it only after the owner proved
 * the inbox by following an emailed confirmation link. It is deliberately not
 * exported from a "use server" file, which would make it callable by anyone.
 * Safe to repeat.
 */
export async function joinNewsletter(email: string): Promise<void> {
  const resend = getResend();
  const { data: existing, error: getError } = await resend.contacts.get({ email });
  if (getError && getError.name !== "not_found") throw new Error("Could not check contact");
  if (!existing) {
    const { error } = await resend.contacts.create({
      email,
      unsubscribed: false,
      segments: [{ id: NEWSLETTER_SEGMENT }],
      topics: [{ id: NEWSLETTER_TOPIC, subscription: "opt_in" }],
    });
    if (error) throw new Error("Could not subscribe to the newsletter");
    return;
  }
  const [segments, topics] = await Promise.all([
    resend.contacts.segments.list({ contactId: existing.id }),
    resend.contacts.topics.list({ email }),
  ]);
  if (segments.error || topics.error || !segments.data || !topics.data) {
    throw new Error("Could not check newsletter subscription");
  }
  const isMember = segments.data.data.some((segment) => segment.id === NEWSLETTER_SEGMENT);
  const isOptedIn = topics.data.data.some(
    (topic) => topic.id === NEWSLETTER_TOPIC && topic.subscription === "opt_in",
  );
  if (isMember && isOptedIn && !existing.unsubscribed) return;
  if (!isOptedIn) {
    const { error } = await resend.contacts.topics.update({
      email,
      topics: [{ id: NEWSLETTER_TOPIC, subscription: "opt_in" }],
    });
    if (error) throw new Error("Could not subscribe to newsletter topic");
  }
  if (!isMember) {
    const { error } = await resend.contacts.segments.add({ contactId: existing.id, segmentId: NEWSLETTER_SEGMENT });
    if (error) throw new Error("Could not join newsletter segment");
  }
  if (existing.unsubscribed) {
    const { error } = await resend.contacts.update({ id: existing.id, unsubscribed: false });
    if (error) throw new Error("Could not restore contact subscription");
  }
}

/** Whether an address already has a contact, and whether it is currently subscribed to the newsletter. */
export async function newsletterState(email: string): Promise<{ target: LinkTarget | null; subscribed: boolean }> {
  const resend = getResend();
  const { data: existing, error } = await resend.contacts.get({ email });
  if (error && error.name !== "not_found") throw new Error("Could not check contact");
  if (!existing) return { target: null, subscribed: false };
  const [segments, topics] = await Promise.all([
    resend.contacts.segments.list({ contactId: existing.id }),
    resend.contacts.topics.list({ email }),
  ]);
  if (segments.error || topics.error || !segments.data || !topics.data) {
    throw new Error("Could not check newsletter subscription");
  }
  const subscribed =
    !existing.unsubscribed &&
    segments.data.data.some((segment) => segment.id === NEWSLETTER_SEGMENT) &&
    topics.data.data.some((topic) => topic.id === NEWSLETTER_TOPIC && topic.subscription === "opt_in");
  return { target: toLinkTarget(existing.id, existing.properties), subscribed };
}

/** Stores an address that has not confirmed yet: in no segment and opted out, so it receives nothing. */
export async function addUnconfirmedContact(email: string): Promise<LinkTarget> {
  const { data, error } = await getResend().contacts.create({
    email,
    unsubscribed: false,
    topics: [{ id: NEWSLETTER_TOPIC, subscription: "opt_out" }],
  });
  if (error || !data) {
    console.error(`Resend contact create failed: ${error?.message}`);
    throw new Error("Resend contact create failed");
  }
  return { id: data.id, lastLinkSentAt: null };
}
