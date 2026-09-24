import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { setSubscriberStatus, type PersonalPlan } from "@/lib/subscribers";

const eventSchema = z.object({
  type: z.string(),
  data: z.object({
    customer: z
      .object({
        email: z.string().email().optional(),
        external_id: z.string().nullish(),
      })
      .optional(),
    metadata: z.record(z.string(), z.string()).nullish(),
  }),
});

function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => kv.split("=") as [string, string]),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("polar-signature");
  if (!verifySignature(rawBody, signatureHeader, secret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const parsed = eventSchema.safeParse(JSON.parse(rawBody));
  if (!parsed.success) {
    return new Response("Bad payload", { status: 400 });
  }

  const { type, data } = parsed.data;
  const email = data.customer?.external_id ?? data.customer?.email;
  if (!email) return new Response("No customer", { status: 200 });

  const plan = (data.metadata?.plan ?? "personal") as PersonalPlan;

  if (type === "subscription.active" || type === "subscription.updated") {
    await setSubscriberStatus(email, "active", plan);
  } else if (
    type === "subscription.canceled" ||
    type === "subscription.revoked" ||
    type === "subscription.uncanceled"
  ) {
    await setSubscriberStatus(
      email,
      type === "subscription.uncanceled" ? "active" : "canceled",
    );
  }

  return new Response("ok", { status: 200 });
}
