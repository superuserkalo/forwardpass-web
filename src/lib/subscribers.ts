import { Resend } from "resend";

export type PersonalPlan = "personal" | "professional";
export type SubscriberStatus = "pending" | "active" | "canceled";

export interface Subscriber {
  email: string;
  interests: string;
  plan: PersonalPlan;
  status: SubscriberStatus;
}

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured.");
  return new Resend(key);
}

export async function upsertSubscriber(subscriber: Subscriber): Promise<void> {
  const resend = getResend();
  const properties = {
    interests: subscriber.interests,
    personal_plan: subscriber.plan,
    personal_status: subscriber.status,
  };

  const { data: existing, error: getError } = await resend.contacts.get({
    email: subscriber.email,
  });

  if (getError || !existing) {
    const { error } = await resend.contacts.create({
      email: subscriber.email,
      unsubscribed: false,
      properties,
    });
    if (error) {
      console.error(`Subscriber create failed: ${error.message}`);
      throw new Error("Subscriber create failed");
    }
    return;
  }

  const { error } = await resend.contacts.update({
    id: existing.id,
    properties,
  });
  if (error) {
    console.error(`Subscriber update failed: ${error.message}`);
    throw new Error("Subscriber update failed");
  }
}

export async function setSubscriberStatus(
  email: string,
  status: SubscriberStatus,
  plan?: PersonalPlan,
): Promise<void> {
  const resend = getResend();
  const { data: existing, error: getError } = await resend.contacts.get({
    email,
  });
  if (getError || !existing) return;

  const properties: Record<string, string> = { personal_status: status };
  if (plan) properties.personal_plan = plan;

  await resend.contacts.update({ id: existing.id, properties });
}

export async function setInterests(
  email: string,
  interests: string,
): Promise<void> {
  const resend = getResend();
  const { data: existing, error: getError } = await resend.contacts.get({
    email,
  });
  if (getError || !existing) {
    throw new Error("No subscriber found for that address.");
  }
  await resend.contacts.update({
    id: existing.id,
    properties: { interests },
  });
}
