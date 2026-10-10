"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import styles from "./newsletter-form.module.css";
import { trackConversion } from "@/lib/analytics-events";
import {
  advertisingInquiryAction,
  contactAction,
  requestUnsubscribeLinkAction,
  unsubscribeAction,
} from "@/lib/forward-pass";
import { beginAuthAction } from "@/lib/auth-actions";
import { AccountForm } from "./account-form";
import { useFormStatus } from "react-dom";
import { TurnstileWidget } from "@/components/turnstile-widget";

function inputClass() {
  return "flex h-14 w-full min-w-0 border border-input bg-transparent px-4 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:cursor-not-allowed disabled:opacity-50";
}

function buttonClass() {
  return "inline-flex h-14 shrink-0 items-center justify-center gap-2 whitespace-nowrap bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";
}

function NewsletterButtons() {
  const { pending } = useFormStatus();
  return <button type="submit" name="provider" value="email" disabled={pending} className={styles.button}>{pending ? "Continuing..." : "Join"}<ArrowRight aria-hidden="true" className="size-4" /></button>;
}

function NewsletterGoogleButton() {
  const { pending } = useFormStatus();
  return (
    <div className={styles.providerOptions}>
      <div className={styles.providerDivider}><span>Or continue with</span><span aria-hidden="true" /></div>
      <button type="submit" name="provider" value="google" formNoValidate disabled={pending} className={styles.providerButton}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3c-.9.6-2 1-3.4 1-2.7 0-5-1.8-5.8-4.3a6 6 0 0 1 0-3.7A6.1 6.1 0 0 1 12 5.8c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 12 1.8 10.2 10.2 0 0 0 1.8 12 10.2 10.2 0 0 0 12 22.2c2.7 0 5-.9 6.7-2.5 1.9-1.8 2.9-4.4 2.9-7.5Z" /></svg>
        {pending ? "Continuing..." : "Google"}
      </button>
    </div>
  );
}

export function NewsletterForm({ animatePlaceholder = false }: { animatePlaceholder?: boolean }) {
  return (
    <form action={beginAuthAction} onSubmit={() => trackConversion("newsletter_signup_started")} className="mt-8 max-w-2xl" aria-label="Newsletter signup">
      <input type="hidden" name="mode" value="signup" />
      <input type="hidden" name="newsletter" value="on" />
      <div className={styles.frame}>
        <span aria-hidden="true" className={styles.shine} />
        <div className={styles.field}>
          <input name="email" type="email" autoComplete="email" aria-label="Email address" placeholder={animatePlaceholder ? "your@email.com" : "Email address"} required maxLength={254} className={`${styles.input} ${animatePlaceholder ? styles.terminalInput : ""}`} />
          {animatePlaceholder && <span aria-hidden="true" className={styles.placeholder}><span className={styles.placeholderText}>your@email.com</span><span className={styles.caret} /></span>}
        </div>
        <NewsletterButtons />
      </div>
      <NewsletterGoogleButton />
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>Free to subscribe. No password. Unsubscribe anytime.</span>
        <span><Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy</Link>{" & "}<Link href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms</Link></span>
      </div>
    </form>
  );
}

export function SignInForm() {
  return <AccountForm />;
}

export function UnsubscribeForm({ initialEmail, token }: { initialEmail?: string; token?: string }) {
  const [status, setStatus] = useState<"unsubscribed" | "link-sent" | "error" | null>(null);
  const [linkExpired, setLinkExpired] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const confirming = Boolean(token) && !linkExpired;

  function confirm() {
    if (!token) return;
    setStatus(null);
    startTransition(async () => {
      try {
        await unsubscribeAction(token);
        setStatus("unsubscribed");
      } catch {
        setLinkExpired(true);
        setStatus("error");
      }
    });
  }

  function requestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus(null);
    startTransition(async () => {
      try {
        await requestUnsubscribeLinkAction(String(form.get("email")), captcha ?? "");
        setStatus("link-sent");
      } catch {
        setStatus("error");
        setCaptcha(null);
        setResetKey((key) => key + 1);
      }
    });
  }

  if (status === "unsubscribed" || status === "link-sent") {
    return (
      <div className="mt-10 flex min-h-14 items-center gap-3 border-y border-border py-4 text-sm" role="status">
        <Check className="size-4" aria-hidden="true" />
        {status === "unsubscribed"
          ? "You’ve been unsubscribed."
          : "If that address is subscribed, we’ve emailed you a link to confirm. Open it to finish unsubscribing."}
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="mt-10">
        <button type="button" onClick={confirm} disabled={isPending} className={buttonClass()}>
          {isPending ? "Removing…" : "Confirm unsubscribe"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={requestLink} className="mt-10" aria-label="Unsubscribe">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input name="email" type="email" autoComplete="email" placeholder="Email address" defaultValue={initialEmail ?? ""} required className={inputClass()} />
        <button type="submit" disabled={isPending} className={buttonClass()}>
          {isPending ? "Sending…" : "Email me a link"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </div>
      <TurnstileWidget action="unsubscribe" onToken={setCaptcha} resetKey={resetKey} />
      {status === "error" ? (
        <p className="mt-3 text-xs" role="alert">
          {linkExpired ? "That link is invalid or has expired. Request a new one." : "Couldn’t send the link. Please email hello@withradian.com."}
        </p>
      ) : null}
    </form>
  );
}

export function AdvertisingForm() {
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    setStatus(null);
    startTransition(async () => {
      try {
        await advertisingInquiryAction({
          name: String(form.get("name")),
          email: String(form.get("email")),
          company: String(form.get("company")),
          website: String(form.get("website")),
          inquiry: String(form.get("inquiry")),
          budget: String(form.get("budget") ?? ""),
        });
        target.reset();
        trackConversion("advertising_inquiry_submitted");
        setStatus("success");
      } catch {
        setStatus("error");
      }
    });
  }

  if (status === "success") {
    return (
      <div className="mt-8 flex min-h-36 items-center gap-3 border-y border-border text-sm" role="status">
        <Check className="size-4" aria-hidden="true" />
        Thanks. We’ll be in touch.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Advertising inquiry">
      <Field label="Name"><input name="name" autoComplete="name" required className={inputClass()} /></Field>
      <Field label="Email"><input name="email" type="email" autoComplete="email" required className={inputClass()} /></Field>
      <Field label="Company"><input name="company" autoComplete="organization" required className={inputClass()} /></Field>
      <Field label="Company website"><input name="website" type="url" inputMode="url" placeholder="https://" required className={inputClass()} /></Field>
      <Field label="What do you want to promote?" wide><textarea name="inquiry" required rows={5} className={`${inputClass()} min-h-28`} /></Field>
      <Field label="Approximate budget (optional)" wide><input name="budget" className={inputClass()} /></Field>
      <div className="flex items-center gap-4 md:col-span-2">
        <button type="submit" disabled={isPending} className={buttonClass()}>
          {isPending ? "Sending…" : "Get in touch"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
        {status === "error" ? <span className="text-xs text-muted-foreground" role="alert">Couldn’t send. Please try again.</span> : null}
      </div>
    </form>
  );
}

export function ContactForm() {
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus(null);
    startTransition(async () => {
      try {
        await contactAction(
          { name: String(form.get("name")), email: String(form.get("email")), message: String(form.get("message")) },
          token ?? "",
        );
        trackConversion("contact_submitted");
        setStatus("success");
      } catch {
        setStatus("error");
        setToken(null);
        setResetKey((key) => key + 1);
      }
    });
  }

  if (status === "success") {
    return (
      <div className="mt-8 flex min-h-36 items-center gap-3 border-y border-border text-sm" role="status">
        <Check className="size-4" aria-hidden="true" />
        Thanks. We read every message and will reply by email.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Contact">
      <Field label="Name"><input name="name" autoComplete="name" required className={inputClass()} /></Field>
      <Field label="Email"><input name="email" type="email" autoComplete="email" required className={inputClass()} /></Field>
      <Field label="How can we help?" wide><textarea name="message" required minLength={10} rows={5} className={`${inputClass()} min-h-28`} /></Field>
      <div className="md:col-span-2">
        <div className="flex items-center gap-4">
          <button type="submit" disabled={isPending} className={buttonClass()}>
            {isPending ? "Sending…" : "Send message"}
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
          {status === "error" ? <span className="text-xs text-muted-foreground" role="alert">Couldn’t send. Please try again or email hello@withradian.com.</span> : null}
        </div>
        <TurnstileWidget action="contact" onToken={setToken} resetKey={resetKey} />
      </div>
    </form>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={wide ? "grid gap-2 md:col-span-2" : "grid gap-2"}>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
