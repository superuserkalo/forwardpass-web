import { Resend } from "resend";

// Run once per Resend account before enabling onboarding in production.
if (!process.env.RESEND_API_KEY) throw new Error("Set RESEND_API_KEY first.");
const resend = new Resend(process.env.RESEND_API_KEY);
const keys = [
  "interests",
  "personal_plan",
  "personal_status",
  "personal_trial_ends_at",
  "onboarding_profile",
];
const existing = new Map();
let after;
do {
  const { data, error } = await resend.contactProperties.list({
    limit: 100,
    ...(after ? { after } : {}),
  });
  if (error || !data)
    throw new Error(error?.message ?? "Could not read contact properties");
  for (const property of data.data) existing.set(property.key, property.type);
  after = data.has_more ? data.data.at(-1)?.id : undefined;
} while (after);
for (const key of keys) {
  if (existing.has(key)) {
    if (existing.get(key) !== "string")
      throw new Error(`${key} must have type string`);
    continue;
  }
  const { error } = await resend.contactProperties.create({
    key,
    type: "string",
  });
  if (error) throw new Error(`${key}: ${error.message}`);
  console.log(`Created ${key}`);
  await new Promise((resolve) => setTimeout(resolve, 600));
}
console.log("Onboarding contact properties are ready.");
