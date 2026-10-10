import { Resend } from "resend";
import { z } from "zod";
import { joinNewsletter, NEWSLETTER_TOPIC } from "./newsletter";

export const authIntentSchema = z.object({
  newsletter: z.boolean(),
});

/** Called only with the identity returned by the WorkOS callback. */
export async function syncAccount(
  user: { id: string; email: string; emailVerified: boolean },
  state?: string,
): Promise<void> {
  if (!user.emailVerified) throw new Error("Verify your email before continuing.");
  const email = z.email().parse(user.email).toLowerCase();
  const intent = state ? authIntentSchema.parse(JSON.parse(state)) : { newsletter: false };
  if (intent.newsletter) {
    await joinNewsletter(email);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data: contact, error } = await resend.contacts.get({ email });
  if (error && error.name !== "not_found") throw new Error("Could not load your account.");
  // Match existing readers by their verified email. Never reset briefs, trials,
  // paid status, or previous opt-outs simply because they signed in.
  if (!contact) {
    const created = await resend.contacts.create({
      email,
      unsubscribed: false,
      topics: [{ id: NEWSLETTER_TOPIC, subscription: "opt_out" }],
    });
    if (created.error) throw new Error("Could not create your reader account.");
  }
}
