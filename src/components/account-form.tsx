"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { beginAuthAction } from "@/lib/auth-actions";
import { GitHubIcon } from "./github-icon";

function AuthButtons() {
  const { pending } = useFormStatus();
  return (
    <>
      <button name="provider" value="google" type="submit" formNoValidate disabled={pending} className="flex h-14 w-full items-center justify-center gap-3 bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3c-.9.6-2 1-3.4 1-2.7 0-5-1.8-5.8-4.3a6 6 0 0 1 0-3.7A6.1 6.1 0 0 1 12 5.8c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 12 1.8 10.2 10.2 0 0 0 1.8 12 10.2 10.2 0 0 0 12 22.2c2.7 0 5-.9 6.7-2.5 1.9-1.8 2.9-4.4 2.9-7.5Z" /></svg>
        {pending ? "Continuing..." : "Continue with Google"}
      </button>
      <button name="provider" value="github" type="submit" formNoValidate disabled={pending} className="mt-3 flex h-14 w-full items-center justify-center gap-3 border border-border bg-secondary text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50">
        <GitHubIcon className="size-5" />
        {pending ? "Continuing..." : "Continue with GitHub"}
      </button>
      <div className="my-7 flex items-center gap-5 font-mono text-xs uppercase tracking-widest text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
      <label className="grid gap-3">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Email</span>
        <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} disabled={pending} className="h-14 w-full border border-input bg-transparent px-4 text-base outline-none placeholder:text-muted-foreground focus:border-ring disabled:opacity-50" />
      </label>
      <button name="provider" value="email" type="submit" disabled={pending} className="mt-3 h-14 w-full border border-border bg-secondary text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50">{pending ? "Continuing..." : "Continue with email"}</button>
    </>
  );
}

export function AccountForm({ mode = "signin", next = "/auth/complete", error }: { mode?: "signin" | "signup"; next?: string; error?: string }) {
  return (
    <form action={beginAuthAction} className="mt-9 w-full" aria-label={mode === "signup" ? "Create your account" : "Sign in"}>
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="next" value={next} />
      <AuthButtons />
      {mode === "signup" && <label className="mt-6 flex items-start gap-3 text-sm leading-6 text-muted-foreground"><input type="checkbox" name="newsletter" className="mt-1 size-4 accent-[var(--signal)]" /><span>Send me the free daily Forward Pass newsletter.</span></label>}
      <p className="mt-5 text-sm leading-6 text-muted-foreground">No password needed. We&apos;ll verify your email with a code.</p>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">By continuing, you agree to our <Link href="/terms" className="underline underline-offset-4">Terms</Link> and <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>.</p>
      {error && <p role="alert" className="mt-4 text-sm text-foreground">{error === "unavailable" ? "Account sign-in is temporarily unavailable. Please try again shortly." : "We couldn't finish signing you in. Please try again."}</p>}
      <p className="mt-8 text-sm text-muted-foreground">{mode === "signup" ? "Already have an account? " : "New to The Forward Pass? "}<Link href={`/${mode === "signup" ? "signin" : "signup"}?next=${encodeURIComponent(next)}`} className="text-foreground underline underline-offset-4">{mode === "signup" ? "Sign in" : "Create an account"}</Link></p>
    </form>
  );
}
