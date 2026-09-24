import type { Plan } from "./pricing";

export function paidStatusChange(
  currentStatus: string,
  currentPlan: string,
  paidPlan: Plan | null,
): { status: "active" | "canceled"; plan?: Plan } | null {
  if (paidPlan) {
    if (currentStatus === "active" && currentPlan === paidPlan) return null;
    return { status: "active", plan: paidPlan };
  }
  if (currentStatus === "active") return { status: "canceled" };
  return null;
}
