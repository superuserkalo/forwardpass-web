"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import styles from "./newsletter-form.module.css";
import {
  advertisingInquiryAction,
  subscribeAction,
  unsubscribeAction,
} from "@/lib/forward-pass";

function inputClass() {
  return "flex h-14 w-full border border-input bg-transparent px-4 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:cursor-not-allowed disabled:opacity-50";
}

function buttonClass() {
  return "inline-flex h-14 items-center justify-center gap-2 bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";
}

export function NewsletterForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"success" | "error" | "already_registered" | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus(null);
    startTransition(async () => {
      try {
        const result = await subscribeAction(String(form.get("email")));
        if (result.alreadyRegistered) {
          setStatus("already_registered");
          return;
        }
        if (result.canOnboard) { router.push("/welcome"); return; }
        setStatus("success");
      } catch {
        setStatus("error");
      }
    });
  }

  if (status === "success") {
    return (
      <div className="flex min-h-14 items-center gap-3 border-y border-border py-4 font-mono text-sm" role="status">
        <Check className="size-4" aria-hidden="true" />
        You’re on the list.
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
      <div className="mt-3 flex justify-between gap-4 text-xs text-muted-foreground">
        <span>No noise. One issue a day. We promise :)</span>
        {status === "error" ? <span role="alert">Couldn’t subscribe. Please try again.</span> : null}
        {status === "already_registered" ? <span role="alert">This email is already registered.</span> : null}
      </div>
    </form>
  );
}

export function UnsubscribeForm({ initialEmail }: { initialEmail?: string }) {
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus(null);
    startTransition(async () => {
      try {
        await unsubscribeAction(String(form.get("email")));
        setStatus("success");
      } catch {
        setStatus("error");
      }
    });
  }

  if (status === "success") {
    return (
      <div className="mt-10 flex min-h-14 items-center gap-3 border-y border-border py-4 text-sm" role="status">
        <Check className="size-4" aria-hidden="true" />
        You’ve been unsubscribed.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-10" aria-label="Unsubscribe">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input name="email" type="email" autoComplete="email" placeholder="Email address" defaultValue={initialEmail ?? ""} required className={inputClass()} />
        <button type="submit" disabled={isPending} className={buttonClass()}>
          {isPending ? "Removing…" : "Unsubscribe"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </div>
      {status === "error" ? (
        <p className="mt-3 text-xs" role="alert">Couldn’t unsubscribe. Please email hello@withradian.com.</p>
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
