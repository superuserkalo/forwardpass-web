"use client";

import { Analytics } from "@vercel/analytics/next";
import { redactAnalyticsEvent } from "@/lib/analytics-privacy";

export function WebAnalytics() {
  return <Analytics beforeSend={redactAnalyticsEvent} />;
}
