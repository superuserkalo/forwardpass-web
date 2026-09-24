import { z } from "zod";

export const ROLES = [
  "Developer",
  "ML engineer",
  "Data scientist",
  "Product manager",
  "Researcher",
  "Founder",
  "Executive",
  "Investor",
  "Student",
  "Other",
] as const;
export const TOPICS = [
  "Agents",
  "APIs",
  "Audio",
  "Benchmarks",
  "Data",
  "Development",
  "GPUs",
  "Image",
  "Infrastructure",
  "LLMs",
  "Open source",
  "Post-training",
  "Reasoning",
  "Retrieval",
  "Robotics",
  "Security",
  "Training",
  "Video",
] as const;
export const CONTENT = ["News", "Papers", "Models", "Repos"] as const;
export const SENIORITY = [
  "Individual contributor",
  "Manager",
  "Director",
  "VP",
  "Executive",
] as const;
export const onboardingSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80),
  role: z.enum(ROLES),
  seniority: z.union([z.enum(SENIORITY), z.literal("")]),
  company: z.string().trim().max(100),
  topics: z.array(z.enum(TOPICS)).min(1).max(TOPICS.length),
  content: z.array(z.enum(CONTENT)).min(1).max(CONTENT.length),
  format: z.enum(["Briefing", "Links only"]),
  notes: z.string().trim().max(180),
});
export const onboardingDraftSchema = onboardingSchema.extend({
  firstName: z.string().max(80),
  topics: z.array(z.enum(TOPICS)).max(TOPICS.length),
  content: z.array(z.enum(CONTENT)).max(CONTENT.length),
});
export type ReadingProfile = z.infer<typeof onboardingSchema>;
export function readingBrief(profile: ReadingProfile): string {
  return [
    `Role: ${profile.role}.`,
    `Topics: ${profile.topics.join(", ")}.`,
    `Include: ${profile.content.join(", ")}.`,
    `Format: ${profile.format}.`,
    profile.notes,
  ]
    .filter(Boolean)
    .join(" ");
}
export const TRIAL_DAYS = 14;
export function personalAccess(
  status: string,
  trialEndsAt: string,
  now = Date.now(),
): boolean {
  return (
    status === "active" || (status === "trial" && Date.parse(trialEndsAt) > now)
  );
}

export type OnboardingResult = {
  status: "trial" | "free" | "active" | "expired";
  trialEndsAt: string | null;
};
export function existingOnboardingResult(
  status: string,
  trialEndsAt: string,
  now = Date.now(),
): OnboardingResult | null {
  if (status === "active") return { status: "active", trialEndsAt: null };
  if (trialEndsAt)
    return {
      status: personalAccess(status, trialEndsAt, now) ? "trial" : "expired",
      trialEndsAt,
    };
  if (status === "free") return { status: "free", trialEndsAt: null };
  return null;
}
