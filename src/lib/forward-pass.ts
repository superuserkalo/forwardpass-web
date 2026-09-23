"use server";

import { Resend } from "resend";
import { z } from "zod";

const NEWSLETTER_SEGMENT = "2ec79559-e5f2-4a84-887b-5cee315656a3";
const ADVERTISER_SEGMENT = "bc122c83-9999-492c-b4e3-135972d0c130";

const newsletterSchema = z.object({
  email: z.string().trim().email().max(254),
});

const inquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  company: z.string().trim().min(1).max(120),
  website: z.string().trim().url().max(300),
  inquiry: z.string().trim().min(10).max(3000),
  budget: z.string().trim().max(120).optional(),
});

type Contact = {
  email: string;
  first_name?: string;
  last_name?: string;
  properties?: Record<string, string>;
  unsubscribed?: boolean;
};

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Email service is not configured");
  return new Resend(key);
}

async function upsertContact(
  contact: { email: string; firstName?: string; lastName?: string },
  segmentId: string,
) {
  const resend = getResend();
  const { data: existing, error: getError } = await resend.contacts.get({
    email: contact.email,
  });

  if (getError || !existing) {
    const { error: createError } = await resend.contacts.create({
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      unsubscribed: false,
      segments: [{ id: segmentId }],
    });
    if (createError) {
      console.error(`Resend contact create failed: ${createError.message}`);
      throw new Error("Resend contact create failed");
    }
    return;
  }

  const { error: updateError } = await resend.contacts.update({
    id: existing.id,
    unsubscribed: false,
    firstName: contact.firstName,
    lastName: contact.lastName,
  });
  if (updateError) {
    console.error(`Resend contact update failed: ${updateError.message}`);
    throw new Error("Resend contact update failed");
  }

  const { error: segmentError } = await resend.contacts.segments.add({
    contactId: existing.id,
    segmentId,
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

const SITE_URL = "https://forwardpass.lovable.app";

function welcomeEmailHtml(email: string) {
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
  return `<div style="background:#0a0a0a;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:0 24px;color:#f5f5f5;">
    <p style="margin:0 0 32px;font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#a3a3a3;">The Forward Pass</p>
    <h1 style="margin:0 0 20px;font-size:26px;line-height:1.2;font-weight:normal;color:#f5f5f5;">You're on the list.</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#d4d4d4;">You'll get one issue a day on what's changing in AI engineering — the important models, agents, research, infrastructure and tools, with primary sources.</p>
    <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#d4d4d4;">No noise. One issue a day. We promise :)</p>
    <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:12px;color:#737373;">— Kaloyan, The Forward Pass</p>
    <p style="margin:32px 0 0;font-family:'Courier New',monospace;font-size:11px;color:#737373;">Didn't sign up? <a href="${escapeHtml(unsubscribeUrl)}" style="color:#a3a3a3;">Unsubscribe</a></p>
  </div>
</div>`;
}

export async function subscribeAction(email: string) {
  const data = newsletterSchema.parse({ email });
  await upsertContact({ email: data.email }, NEWSLETTER_SEGMENT);

  try {
    await getResend().emails.send({
      from: "The Forward Pass <hello@withradian.com>",
      to: [data.email],
      replyTo: "hello@withradian.com",
      subject: "You're on the list — The Forward Pass",
      html: welcomeEmailHtml(data.email),
      text: `You're on the list.\n\nYou'll get one issue a day on what's changing in AI engineering — the important models, agents, research, infrastructure and tools, with primary sources.\n\nNo noise. One issue a day. We promise :)\n\n— Kaloyan, The Forward Pass\n\nDidn't sign up? Unsubscribe: ${SITE_URL}/unsubscribe?email=${encodeURIComponent(data.email)}`,
    });
  } catch (error) {
    console.error("Welcome email failed", error);
  }

  return { success: true };
}

export async function unsubscribeAction(email: string) {
  const data = newsletterSchema.parse({ email });
  const { data: existing, error: getError } = await getResend().contacts.get({
    email: data.email,
  });
  if (getError || !existing) {
    return { success: true };
  }
  const { error } = await getResend().contacts.update({
    id: existing.id,
    unsubscribed: true,
  });
  if (error) {
    console.error(`Resend unsubscribe failed: ${error.message}`);
    throw new Error("Resend unsubscribe failed");
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
  await upsertContact(
    { email: data.email, firstName, lastName: lastName.join(" ") },
    ADVERTISER_SEGMENT,
  );

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
    subject: `Advertising inquiry — ${data.company}`,
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
