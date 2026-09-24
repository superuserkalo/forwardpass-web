import { Resend } from "resend";
import { paidStatusChange } from "./polar-status";

export type PersonalPlan = "personal" | "professional";
export type SubscriberStatus =
  "pending" | "active" | "canceled" | "trial" | "free";

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

  if (getError && getError.name !== "not_found") {
    throw new Error("Could not check subscriber status.");
  }
  if (!existing) {
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

  // Checkout is unauthenticated. A submitted email alone must not edit an
  // existing contact; the billing webhook updates its entitlement after payment.
}

export async function syncPaidSubscriber(
  email: string,
  plan: PersonalPlan | null,
): Promise<void> {
  const resend = getResend();
  const { data: existing, error: getError } = await resend.contacts.get({
    email,
  });
  if (getError && getError.name !== "not_found") {
    throw new Error("Could not check subscriber for Polar event.");
  }
  if (!existing) {
    if (!plan) return;
    const { error } = await resend.contacts.create({
      email,
      unsubscribed: false,
      properties: { interests: "", personal_plan: plan, personal_status: "active" },
    });
    if (error) throw new Error("Could not create subscriber for Polar event.");
    return;
  }

  const change = paidStatusChange(
    String(existing.properties.personal_status?.value ?? ""),
    String(existing.properties.personal_plan?.value ?? ""),
    plan,
  );
  if (!change) return;

  const properties: Record<string, string> = { personal_status: change.status };
  if (change.plan) properties.personal_plan = change.plan;

  const { error } = await resend.contacts.update({ id: existing.id, properties });
  if (error) throw new Error("Could not update subscriber for Polar event.");
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
