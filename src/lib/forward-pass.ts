"use server";

import { after } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { linkTarget, sendLinkEmail } from "./link-email";
import { verifyLinkToken } from "./link-token";
import { addUnconfirmedContact, newsletterState, NEWSLETTER_SEGMENT, NEWSLETTER_TOPIC } from "./newsletter";
import { requireHuman } from "./turnstile";

const ADVERTISER_SEGMENT = "bc122c83-9999-492c-b4e3-135972d0c130";

const newsletterSchema = z.object({
  email: z.string().trim().email().max(254).toLowerCase(),
});

const inquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  company: z.string().trim().min(1).max(120),
  website: z.string().trim().url().max(300),
  inquiry: z.string().trim().min(10).max(3000),
  budget: z.string().trim().max(120).optional(),
});

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(3000),
});

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Email service is not configured");
  return new Resend(key);
}

async function upsertAdvertiser(contact: { email: string; firstName?: string; lastName?: string }) {
  const resend = getResend();
  const { data: existing, error: getError } = await resend.contacts.get({
    email: contact.email,
  });

  if (getError && getError.name !== "not_found") throw new Error("Could not check contact");
  if (!existing) {
    const { error: createError } = await resend.contacts.create({
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      unsubscribed: false,
      segments: [{ id: ADVERTISER_SEGMENT }],
    });
    if (createError) {
      console.error(`Resend contact create failed: ${createError.message}`);
      throw new Error("Resend contact create failed");
    }
    return;
  }

  const { error: updateError } = await resend.contacts.update({
    id: existing.id,
    firstName: contact.firstName,
    lastName: contact.lastName,
  });
  if (updateError) throw new Error("Resend contact update failed");

  const { error: segmentError } = await resend.contacts.segments.add({
    contactId: existing.id,
    segmentId: ADVERTISER_SEGMENT,
  });
  if (segmentError) {
    console.error(`Resend segment update failed: ${segmentError.message}`);
    throw new Error("Resend segment update failed");
  }
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character] ?? character;
  });

/**
 * Answers `{ success: true }` for every address, new or already registered, so
 * the form cannot be used to discover who is subscribed. Nothing here subscribes
 * anyone: the address gets a confirmation link (or, if already subscribed, a
 * sign-in link), and following the link is what proves the inbox is theirs.
 */
export async function subscribeAction(email: string, turnstileToken: string): Promise<{ success: true }> {
  await requireHuman("signup", turnstileToken);
  const data = newsletterSchema.parse({ email });
  const state = await newsletterState(data.email);
  const target = state.target ?? (await addUnconfirmedContact(data.email));
  after(() => sendLinkEmail(state.subscribed ? "signin" : "verify", data.email, target));
  return { success: true };
}

/** Emails an unsubscribe confirmation link. Never changes the subscription itself. */
export async function requestUnsubscribeLinkAction(email: string, turnstileToken: string): Promise<{ success: true }> {
  await requireHuman("unsubscribe", turnstileToken);
  const data = newsletterSchema.parse({ email });
  const target = await linkTarget(data.email);
  if (target) after(() => sendLinkEmail("unsubscribe", data.email, target));
  return { success: true };
}

export async function unsubscribeAction(token: string) {
  const verified = verifyLinkToken("unsubscribe", token);
  if (!verified) throw new Error("This unsubscribe link is invalid or has expired.");
  const email = verified.email;
  const resend = getResend();
  const { data: existing, error: getError } = await resend.contacts.get({ email });
  if (getError && getError.name !== "not_found") throw new Error("Could not check contact");
  if (!existing) return { success: true };
  const { error } = await resend.contacts.topics.update({
    email,
    topics: [{ id: NEWSLETTER_TOPIC, subscription: "opt_out" }],
  });
  if (error) {
    console.error(`Resend unsubscribe failed: ${error.message}`);
    throw new Error("Resend unsubscribe failed");
  }
  const segments = await resend.contacts.segments.list({ contactId: existing.id });
  if (segments.error || !segments.data) throw new Error("Could not check newsletter segment");
  if (segments.data.data.some((segment) => segment.id === NEWSLETTER_SEGMENT)) {
    const removed = await resend.contacts.segments.remove({
      contactId: existing.id,
      segmentId: NEWSLETTER_SEGMENT,
    });
    if (removed.error) throw new Error("Could not leave newsletter segment");
  }
  return { success: true };
}

/** Sends a message from the contact form to the team inbox. Nothing is stored beyond the email itself. */
export async function contactAction(
  input: { name: string; email: string; message: string },
  turnstileToken: string,
): Promise<{ success: true }> {
  await requireHuman("contact", turnstileToken);
  const data = contactSchema.parse(input);
  const rows: Array<[string, string]> = [
    ["Name", data.name],
    ["Email", data.email],
    ["Message", data.message],
  ];
  const { error } = await getResend().emails.send({
    from: "The Forward Pass <hello@withradian.com>",
    to: ["hello@withradian.com"],
    replyTo: data.email,
    subject: `Message from ${data.name}`,
    html: `<h1>New message from the contact form</h1>${rows
      .map(([label, value]) => `<p><strong>${escapeHtml(label)}</strong><br>${escapeHtml(value).replace(/\n/g, "<br>")}</p>`)
      .join("")}`,
  });
  if (error) {
    console.error(`Contact email failed: ${error.message}`);
    throw new Error("Contact email failed");
  }
  return { success: true };
}

export async function advertisingInquiryAction(input: {
  name: string;
  email: string;
  company: string;
  website: string;
  inquiry: string;
  budget?: string;
}) {
  const data = inquirySchema.parse(input);
  const [firstName = data.name, ...lastName] = data.name.split(/\s+/);
  await upsertAdvertiser({ email: data.email, firstName, lastName: lastName.join(" ") });

  const rows: Array<[string, string]> = [
    ["Name", data.name],
    ["Work email", data.email],
    ["Company", data.company],
    ["Website", data.website],
    ["Approximate budget", data.budget || "Not provided"],
    ["Inquiry", data.inquiry],
  ];
  const { error } = await getResend().emails.send({
    from: "The Forward Pass <hello@withradian.com>",
    to: ["hello@withradian.com"],
    replyTo: data.email,
    subject: `Advertising inquiry from ${data.company}`,
    html: `<h1>New advertising inquiry</h1>${rows
      .map(([label, value]) => `<p><strong>${escapeHtml(label)}</strong><br>${escapeHtml(value)}</p>`)
      .join("")}`,
  });
  if (error) {
    console.error(`Inquiry email failed: ${error.message}`);
    throw new Error("Inquiry email failed");
  }

  return { success: true };
}
