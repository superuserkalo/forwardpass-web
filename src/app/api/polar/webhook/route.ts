import { Webhook, WebhookVerificationError } from "standardwebhooks";
import { z } from "zod";
import { getPolar } from "@/lib/polar";
import { paidPlanForCustomerState } from "@/lib/pricing";
import { syncPaidSubscriber } from "@/lib/subscribers";

const subscriptionEvent = z.object({
  type: z.enum([
    "subscription.active",
    "subscription.updated",
    "subscription.canceled",
    "subscription.uncanceled",
    "subscription.revoked",
  ]),
  data: z.object({ customer_id: z.uuid() }),
});

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook secret not configured", { status: 500 });

  const body = await request.text();
  let payload: unknown;
  try {
    payload = new Webhook(secret).verify(body, {
      "webhook-id": request.headers.get("webhook-id") ?? "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
      "webhook-signature": request.headers.get("webhook-signature") ?? "",
    });
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return new Response("Invalid signature", { status: 401 });
    }
    return new Response("Bad payload", { status: 400 });
  }

  const eventType = z.object({ type: z.string() }).safeParse(payload);
  if (!eventType.success) return new Response("Bad payload", { status: 400 });
  if (!eventType.data.type.startsWith("subscription.")) {
    return new Response("ok", { status: 200 });
  }

  const event = subscriptionEvent.safeParse(payload);
  if (!event.success) return new Response("Bad payload", { status: 400 });

  // Read current state so retries, out-of-order deliveries and customers with
  // multiple subscriptions cannot overwrite their paid entitlement.
  const state = await getPolar().customers.getState({ id: event.data.data.customer_id });
  const email = z.email().safeParse(state.email);
  if (!email.success) return new Response("Missing customer email", { status: 400 });

  const plan = paidPlanForCustomerState(state.activeSubscriptions, process.env);
  await syncPaidSubscriber(email.data, plan);
  return new Response("ok", { status: 200 });
}
