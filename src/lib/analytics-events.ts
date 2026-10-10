"use client";

import { track } from "@vercel/analytics";
import type { BillingPeriod, Plan } from "./pricing";

type ConversionEvent =
  | "newsletter_signup_started"
  | "newsletter_confirmation_requested"
  | "pricing_cta_clicked"
  | "checkout_started"
  | "checkout_created"
  | "checkout_failed"
  | "contact_submitted"
  | "advertising_inquiry_submitted";

export function trackConversion(
  event: ConversionEvent,
  properties?: { plan?: Plan | "free" | "enterprise"; billing_period?: BillingPeriod },
) {
  try {
    track(event, properties);
  } catch {
    // An analytics failure must not interrupt signup, checkout or an inquiry.
  }
}
