"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import styles from "./newsletter-form.module.css";
import {
  advertisingInquiryAction,
  requestUnsubscribeLinkAction,
  subscribeAction,
  unsubscribeAction,
} from "@/lib/forward-pass";
import { requestSignInLinkAction } from "@/lib/signin-actions";
import { TurnstileWidget } from "@/components/turnstile-widget";

function inputClass() {
  return "flex h-14 w-full border border-input bg-transparent px-4 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:cursor-not-allowed disabled:opacity-50";
}

function buttonClass() {
  return "inline-flex h-14 items-center justify-center gap-2 bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";
}

export function NewsletterForm() {
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
        await subscribeAction(String(form.get("email")), token ?? "");
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
      <div className="flex min-h-14 items-center gap-3 border-y border-border py-4 font-mono text-sm" role="status">
        <Check className="size-4" aria-hidden="true" />
        Almost there. Check your inbox and confirm your email to join the list.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 max-w-2xl" aria-label="Newsletter signup">
      <div className={styles.frame}>
        <span aria-hidden="true" className={styles.shine} />
        <input name="email" type="email" autoComplete="email" aria-label="Email address" placeholder="Email address" required className={styles.input} />
        <button type="submit" disabled={isPending} className={styles.button}>
          {isPending ? "Joining…" : "Join"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </div>
      <TurnstileWidget action="signup" onToken={setToken} resetKey={resetKey} />
      <div className="mt-3 flex justify-between gap-4 text-xs text-muted-foreground">
        <span>No noise. One issue a day. We promise :)</span>
        {status === "error" ? <span role="alert">Couldn’t subscribe. Please try again.</span> : null}
      </div>
    </form>
  );
}

/** Asks for an emailed link. The answer is the same for every address, so it never confirms who is subscribed. */
export function SignInForm() {
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
        await requestSignInLinkAction(String(form.get("email")), token ?? "");
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
      <div className="mt-8 flex min-h-14 items-center gap-3 border-y border-border py-4 text-sm" role="status">
        <Check className="size-4" aria-hidden="true" />
        If that address is subscribed, a sign-in link is on its way. It works for 30 minutes.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8" aria-label="Email me a sign-in link">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input name="email" type="email" autoComplete="email" aria-label="Email address" placeholder="Email address" required className={inputClass()} />
        <button type="submit" disabled={isPending} className={buttonClass()}>
          {isPending ? "Sending…" : "Email me a link"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </div>
      <TurnstileWidget action="signin" onToken={setToken} resetKey={resetKey} />
      {status === "error" ? <p className="mt-3 text-xs" role="alert">Couldn’t send the link. Please try again.</p> : null}
    </form>
  );
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

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={wide ? "grid gap-2 md:col-span-2" : "grid gap-2"}>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
