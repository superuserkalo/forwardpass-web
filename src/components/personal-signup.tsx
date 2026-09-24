"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import { startCheckoutAction, updateInterestsAction } from "@/lib/personal-actions";

const inputClass =
  "flex h-14 w-full border border-input bg-transparent px-4 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:cursor-not-allowed disabled:opacity-50";

const buttonClass =
  "inline-flex h-14 items-center justify-center gap-2 bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

export function PersonalSignup({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [plan, setPlan] = useState<"personal" | "professional">("personal");
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus(null);
    startTransition(async () => {
      try {
        const { url } = await startCheckoutAction({
          email: String(form.get("email")),
          interests: String(form.get("interests")),
          plan,
        });
        window.location.href = url;
      } catch {
        setStatus("error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="w-full" aria-label="Personal newsletter signup">
      <fieldset className="mb-3">
        <legend className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Plan
        </legend>
        <div className="grid grid-cols-2 gap-px border border-border bg-border">
          {(
            [
              ["personal", "Personal · $4.99/mo"],
              ["professional", "Professional · $9.99/mo"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPlan(id)}
              aria-pressed={plan === id}
              className={`px-4 py-3 text-xs transition-colors ${
                plan === id
                  ? "bg-primary font-medium text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3">
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email address"
          required
          className={inputClass}
        />
        <textarea
          name="interests"
          required
          minLength={10}
          maxLength={500}
          rows={compact ? 3 : 4}
          placeholder="Describe your ideal issue in plain language — the topics, roles, and tools you care about, and what to skip. e.g. “Agent infrastructure and eval tooling. Sandboxes, serving stacks like vLLM. Skip funding news and consumer apps.”"
          className={`${inputClass} min-h-24 resize-y py-3 leading-relaxed`}
        />
        <button type="submit" disabled={isPending} className={buttonClass}>
          {isPending ? "Redirecting…" : "Start my personal issue"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex justify-between gap-4 text-xs text-muted-foreground">
        <span>Describe it like a system prompt. Edit it any time.</span>
        {status === "error" ? (
          <span role="alert">Couldn’t start checkout. Please try again.</span>
        ) : null}
      </div>
    </form>
  );
}

export function InterestsEditor({ email }: { email: string }) {
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus(null);
    startTransition(async () => {
      try {
        await updateInterestsAction({
          email,
          interests: String(form.get("interests")),
        });
        setStatus("success");
      } catch {
        setStatus("error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} aria-label="Edit your interests">
      <div className="grid gap-3">
        <textarea
          name="interests"
          required
          minLength={10}
          maxLength={500}
          rows={5}
          placeholder="Describe what you want to read about."
          className={`${inputClass} min-h-32 resize-y py-3 leading-relaxed`}
        />
        <button type="submit" disabled={isPending} className={buttonClass}>
          {isPending ? "Saving…" : "Save interests"}
          {status === "success" ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <ArrowRight aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
      {status === "success" ? (
        <p className="mt-3 text-xs text-muted-foreground" role="status">
          Saved. Applies from your next issue.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="mt-3 text-xs" role="alert">
          Couldn’t save. Please try again.
        </p>
      ) : null}
    </form>
  );
}
