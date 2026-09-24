"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Mail } from "lucide-react";
import { OnboardingBuild } from "./onboarding-build";
import { completeOnboardingAction } from "@/lib/onboarding-actions";
import {
  CONTENT,
  ROLES,
  SENIORITY,
  TOPICS,
  onboardingDraftSchema,
  type ReadingProfile,
  type OnboardingResult,
} from "@/lib/onboarding";

const initialProfile: ReadingProfile = {
  firstName: "",
  lastName: "",
  role: "Developer",
  seniority: "",
  company: "",
  topics: [],
  content: ["News"],
  format: "Briefing",
  notes: "",
};
const labels = ["About you", "Your topics", "Your edition", "How it works"];
const TOTAL_STEPS = 4;
const inputClass =
  "h-13 w-full border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-foreground";
const buttonClass =
  "inline-flex min-h-13 items-center justify-center gap-3 bg-primary px-7 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-50";
type Result = Awaited<ReturnType<typeof completeOnboardingAction>>;

const subscribeToHydration = () => () => {};
type OnboardingProps = {
  email: string;
  saved: { profile: ReadingProfile; result: OnboardingResult } | null;
};
export function OnboardingFlow({ email, saved }: OnboardingProps) {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  if (!hydrated)
    return (
      <div
        className="flex min-h-screen items-center justify-center font-mono text-xs text-muted-foreground"
        role="status"
      >
        Loading your reading preferences…
      </div>
    );
  return <OnboardingForm email={email} saved={saved} />;
}
function OnboardingForm({ email, saved }: OnboardingProps) {
  const key = `forwardpass-onboarding:${email}`;
  const [profile, setProfile] = useState<ReadingProfile>(() => {
    if (saved) return saved.profile;
    try {
      const raw = sessionStorage.getItem(key);
      const parsed = raw
        ? onboardingDraftSchema.safeParse(JSON.parse(raw))
        : null;
      if (parsed?.success) return parsed.data;
    } catch {
      /* Draft storage is optional. */
    }
    return initialProfile;
  });
  const [step, setStep] = useState(saved ? 3 : 0);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(saved?.result ?? null);
  const heading = useRef<HTMLHeadingElement>(null);
  const finishBuild = useCallback(() => {
    setSaving(false);
    if (!result) setConfirming(true);
  }, [result]);
  useEffect(() => {
    if (result) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(profile));
    } catch {
      /* Keep the form usable. */
    }
  }, [key, profile, result]);
  useEffect(() => {
    heading.current?.focus();
  }, [step, result, saving, confirming]);

  function update<K extends keyof ReadingProfile>(
    field: K,
    value: ReadingProfile[K],
  ) {
    setProfile((current) => ({ ...current, [field]: value }));
  }
  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (step === 1 && (!profile.topics.length || !profile.content.length)) {
      setError("Choose at least one topic and one content type.");
      return;
    }
    if (step === TOTAL_STEPS - 1) {
      setConfirming(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setStep((current) => current + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function confirm(choice: "trial" | "free") {
    setError("");
    setSaving(true);
    setConfirming(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    try {
      const saved = await completeOnboardingAction(profile, choice);
      setResult(saved);
      setSaving(false);
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* Optional draft cleanup. */
      }
    } catch {
      setError(
        "We couldn't save your edition. Your selections are still here. Please try again.",
      );
      setSaving(false);
      setConfirming(true);
    }
  }

  return (
    <div className="min-h-screen bg-background [color-scheme:dark]">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-4 md:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="The Forward Pass home">
            <Image src="/logo.png" alt="The Forward Pass logo" width={24} height={24} className="size-6" priority />
            <span className="wordmark">THE FORWARD PASS</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 pb-12 pt-7 md:pt-10">
        <div className="mb-7 md:mb-9">
          <div className="mb-4 flex justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>{result && !saving ? "You're all set" : confirming ? `Step 5 of 5` : `Step ${step + 1} of 5`}</span>
            <span>{result ? labels[labels.length - 1] : confirming ? "Your first 14 days" : labels[step]}</span>
          </div>
          <div
            role="progressbar"
            aria-label="Onboarding progress"
            aria-valuemin={0}
            aria-valuemax={5}
            aria-valuenow={result ? 5 : confirming ? 5 : step + 1}
            className="grid grid-cols-5 gap-2"
          >
            {["About you", "Your topics", "Your edition", "How it works", "Your first 14 days"].map((label, index) => (
              <div
                key={label}
                className={`h-[2px] transition-colors duration-500 ${index <= (result ? 4 : confirming ? 4 : step) ? "bg-foreground" : "bg-border"}`}
              />
            ))}
          </div>
        </div>
        <section className="border border-border bg-card p-5 sm:p-7 md:p-8">
          {saving ? (
            <OnboardingBuild
              next="confirm"
              profile={profile}
              saved={result !== null}
              onComplete={finishBuild}
            />
          ) : confirming ? (
            <TrialOffer
              profile={profile}
              headingRef={heading}
              error={error}
              onConfirm={confirm}
              onBack={() => setConfirming(false)}
            />
          ) : result ? (
            <div className="onboarding-enter">
              <h1 ref={heading} tabIndex={-1} className="onboarding-title">
                {result.status === "trial"
                  ? "Your first 14 days of Personal are on us."
                  : result.status === "active"
                    ? "Your paid plan is already active."
                    : "You're on the list."}
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
                {result.status === "trial"
                  ? `Your Personal trial ends ${new Date(result.trialEndsAt ?? "").toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}. No card. No automatic charge. After that, you'll receive the Free issue unless you choose to upgrade.`
                  : result.status === "expired"
                    ? "You've already used your Personal trial. You can choose a paid plan from Pricing."
                    : result.status === "active"
                      ? "Your existing subscription has been kept as it is."
                      : "Your preferences are saved. You'll receive the general daily issue for free."}
              </p>
              <div className="mt-9 border-y border-border py-6">
                <p className="flex items-center gap-3 text-sm">
                  <Mail className="size-4 text-foreground" /> {email}
                </p>
                <p className="mt-4 font-mono text-xs leading-6 text-muted-foreground">
                  {profile.topics.join(" / ")}
                </p>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-6">
                <Link href="/" className={buttonClass}>
                  Back to The Forward Pass <ArrowRight className="size-4" />
                </Link>
                <Link
                  className="text-sm text-muted-foreground underline underline-offset-4"
                  href="/pricing"
                >
                  Explore plans
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={next}>
              <div key={step} className="onboarding-enter">
                <h1 ref={heading} tabIndex={-1} className="onboarding-title">
                  {
                    [
                      "Who's reading?",
                      "What do you want to follow?",
                      "How do you like to read?",
                      "From the research to your inbox.",
                    ][step]
                  }
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                  {
                    [
                      "Tell us a little about your work. We'll use it to shape your reading brief.",
                      "Pick the topics you care about.",
                      "Choose a short briefing or a list of headlines and primary sources.",
                      "Your brief filters the day's research into your edition.",
                    ][step]
                  }
                </p>
                {step === 0 && (
                  <div className="mt-9 space-y-7">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="First name" required>
                        <input
                          autoComplete="given-name"
                          value={profile.firstName}
                          onChange={(event) =>
                            update("firstName", event.target.value)
                          }
                          required
                          maxLength={80}
                          className={inputClass}
                          placeholder="Your first name"
                        />
                      </Field>
                      <Field label="Last name · optional">
                        <input
                          autoComplete="family-name"
                          value={profile.lastName}
                          onChange={(event) =>
                            update("lastName", event.target.value)
                          }
                          maxLength={80}
                          className={inputClass}
                          placeholder="Your last name"
                        />
                      </Field>
                    </div>
                    <Choices
                      label="Your role"
                      options={ROLES}
                      selected={[profile.role]}
                      onChange={(value) => update("role", value)}
                      single
                    />
                    {profile.role !== "Student" && (
                      <div className="grid gap-5 sm:grid-cols-2">
                        <SeniorityField
                          value={profile.seniority}
                          onChange={(value) => update("seniority", value)}
                        />
                        <Field label="Company · optional">
                          <input
                            autoComplete="organization"
                            value={profile.company}
                            onChange={(event) =>
                              update("company", event.target.value)
                            }
                            maxLength={100}
                            className={inputClass}
                            placeholder="Where you work"
                          />
                        </Field>
                      </div>
                    )}
                  </div>
                )}
                {step === 1 && (
                  <div className="mt-9 space-y-8">
                    <Choices
                      label="Topics · choose as many as you like"
                      options={TOPICS}
                      selected={profile.topics}
                      onChange={(value) =>
                        update("topics", toggle(profile.topics, value))
                      }
                      chips
                    />
                    <Choices
                      label="Content I want to see"
                      options={CONTENT}
                      selected={profile.content}
                      onChange={(value) =>
                        update("content", toggle(profile.content, value))
                      }
                    />
                    <p className="font-mono text-[10px] leading-5 text-muted-foreground">
                      Personal uses these. Free stays general.
                    </p>
                  </div>
                )}
                {step === 2 && (
                  <div className="mt-9 space-y-8">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(["Briefing", "Links only"] as const).map((format) => (
                        <label
                          key={format}
                          className={`cursor-pointer border p-5 transition-colors ${profile.format === format ? "border-foreground bg-white/[0.04]" : "border-border hover:border-muted-foreground"}`}
                        >
                          <span className="flex items-center justify-between font-mono text-xs uppercase tracking-wider">
                            {format}
                            <input
                              type="radio"
                              name="format"
                              checked={profile.format === format}
                              onChange={() => update("format", format)}
                              className="accent-foreground"
                            />
                          </span>
                          <p className="mt-4 text-sm leading-6 text-muted-foreground">
                            {format === "Briefing"
                              ? "What happened, why it matters, and the primary source."
                              : "The relevant headlines and links. Skip the prose."}
                          </p>
                        </label>
                      ))}
                    </div>
                    <Field label="Anything to focus on or skip? · optional">
                      <textarea
                        value={profile.notes}
                        onChange={(event) =>
                          update("notes", event.target.value)
                        }
                        rows={3}
                        maxLength={180}
                        className={`${inputClass} h-auto resize-y py-4 leading-6`}
                        placeholder="e.g. Agent infrastructure and evals. Skip funding news and consumer apps."
                      />
                    </Field>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {profile.notes.length}/180 characters
                    </p>
                  </div>
                )}
                {step === 3 && <EditionPreview topics={profile.topics} />}
              </div>
              {error && (
                <p
                  role="alert"
                  className="mt-6 border-l-2 border-foreground pl-4 text-sm"
                >
                  {error}
                </p>
              )}
              <div className="mt-10 flex flex-wrap items-center justify-between gap-5 border-t border-border pt-7">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(step - 1);
                      setError("");
                    }}
                    className="inline-flex min-h-11 items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="size-3" /> Back
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    About a minute.
                  </span>
                )}
                <button className={buttonClass} type="submit">
                  Continue <ArrowRight className="size-4" />
                </button>
              </div>
            </form>
          )}
        </section>
        <div className="mt-6 flex flex-wrap justify-between gap-3 font-mono text-[10px] text-muted-foreground">
          <span>{email}</span>
          <Link href="/privacy" className="underline underline-offset-4">
            How we use your preferences
          </Link>
        </div>
      </main>
    </div>
  );
}
function toggle<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-3">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
        {required && <span className="ml-2 text-foreground">*</span>}
      </span>
      {children}
    </label>
  );
}
function Choices<T extends string>({
  label,
  options,
  selected,
  onChange,
  single,
  chips,
}: {
  label: string;
  options: readonly T[];
  selected: T[];
  onChange: (value: T) => void;
  single?: boolean;
  chips?: boolean;
}) {
  return (
    <fieldset>
      <legend className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label} <span className="text-foreground">*</span>
      </legend>
      <div
        className={chips ? "flex flex-wrap gap-2" : "grid gap-2 sm:grid-cols-2"}
      >
        {options.map((value) => (
          <label
            key={value}
            className={`flex min-h-12 cursor-pointer items-center gap-3 border px-4 py-3 font-mono text-[11px] uppercase tracking-wider transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-foreground ${selected.includes(value) ? "border-muted-foreground bg-white/[0.055] text-foreground" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
          >
            <input
              type={single ? "radio" : "checkbox"}
              name={label}
              checked={selected.includes(value)}
              onChange={() => onChange(value)}
              className={chips ? "sr-only" : "size-3 accent-foreground"}
            />
            {value}
            {chips && selected.includes(value) && (
              <Check aria-hidden className="size-3 text-foreground" />
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-4">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 text-sm leading-6 text-muted-foreground"
        >
          <Check aria-hidden className="mt-1 size-3 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}
function TrialOffer({
  profile,
  headingRef,
  error,
  onConfirm,
  onBack,
}: {
  profile: ReadingProfile;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  error: string;
  onConfirm: (choice: "trial" | "free") => void;
  onBack: () => void;
}) {
  const [pending, setPending] = useState<"trial" | "free" | null>(null);
  return (
    <div className="onboarding-enter">
      <h1 ref={headingRef} tabIndex={-1} className="onboarding-title">
        Your first 14 days of Personal are on us.
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
        An issue written to your interests. No card needed. You decide whether
        to keep it after day 14.
      </p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <div className="border border-muted-foreground bg-background p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-foreground">
            Personalized
          </p>
          <h2 className="mt-3 text-xl">Personal</h2>
          <p className="mt-1 text-sm text-muted-foreground">Free for 14 days</p>
          <FeatureList
            items={[
              "An issue written to your interests",
              "Ad-free daily reading",
              "Briefing or links-only format",
            ]}
          />
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-sm">
              For {profile.firstName}, {profile.role.toLowerCase()}
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase leading-6 tracking-wide text-foreground">
              {profile.topics.join(" · ")}
            </p>
          </div>
        </div>
        <div className="border border-border p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            General
          </p>
          <h2 className="mt-3 text-xl">Free</h2>
          <p className="mt-1 text-sm text-muted-foreground">$0, always</p>
          <FeatureList
            items={[
              "The general daily issue",
              "Curated AI-engineering sources",
              "Supported by sponsors",
            ]}
          />
          <p className="mt-5 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
            Your trial returns to Free automatically. Upgrade only if you want
            to.
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">
        Keep Personal for $4.99/month after your trial, or choose Professional
        for $9.99/month with weekly deep research.{" "}
        <Link href="/pricing" target="_blank" className="underline underline-offset-4">
          Compare plans
        </Link>
        .
      </p>
      {error && (
        <p role="alert" className="mt-5 border-l-2 border-foreground pl-4 text-sm">
          {error}
        </p>
      )}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-5 border-t border-border pt-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Back
        </button>
        <button
          type="button"
          disabled={pending !== null}
          className={buttonClass}
          onClick={() => {
            setPending("trial");
            onConfirm("trial");
          }}
        >
          Start my 14 free days <ArrowRight className="size-4" />
        </button>
      </div>
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => {
          setPending("free");
          onConfirm("free");
        }}
        className="mx-auto mt-5 block min-h-11 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
      >
        Stay on Free
      </button>
    </div>
  );
}
function SeniorityField({
  value,
  onChange,
}: {
  value: ReadingProfile["seniority"];
  onChange: (value: ReadingProfile["seniority"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open ]);
  return (
    <div ref={container} className="grid gap-3">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Seniority · optional
      </span>
      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className={`${inputClass} flex h-13 items-center justify-between gap-3 text-left ${value ? "text-foreground" : "text-muted-foreground"}`}
        >
          <span className="truncate">{value || "Select your level"}</span>
          <ChevronDown aria-hidden className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <ul
            role="listbox"
            aria-label="Seniority level"
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto border border-border bg-card py-1 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]"
          >
            <li role="option" aria-selected={value === ""}>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.06] ${value === "" ? "text-foreground" : "text-muted-foreground"}`}
              >
                Select your level
                {value === "" && <Check aria-hidden className="size-3" />}
              </button>
            </li>
            {SENIORITY.map((level) => (
              <li key={level} role="option" aria-selected={value === level}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(level);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.06] ${value === level ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {level}
                  {value === level && <Check aria-hidden className="size-3" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
function EditionPreview({ topics }: { topics: string[] }) {
  return (
    <div className="mt-10">
      <div
        className="grid items-center gap-5 sm:grid-cols-[1fr_40px_1fr]"
        aria-label="Animation of research becoming your personal edition"
      >
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            The day&apos;s research
          </p>
          <div className="border border-border bg-background">
            <p className="flex items-center gap-2 border-b border-border p-4 font-mono text-[10px] uppercase tracking-wider">
              <span className="size-1.5 bg-foreground motion-safe:animate-pulse" />{" "}
              Models, papers, repos
            </p>
            {[
              "A new model release",
              "An agent evaluation paper",
              "An inference tool update",
              "An open-source framework",
            ].map((text, index) => (
              <div
                key={text}
                className="onboarding-source border-b border-border px-4 py-4 text-xs last:border-0"
                style={{ animationDelay: `${index * 350}ms` }}
              >
                {text}
                <div className="mt-2 h-1 w-2/3 bg-foreground/10" />
              </div>
            ))}
          </div>
        </div>
        <ArrowRight
          aria-hidden
          className="onboarding-flow mx-auto size-6 rotate-90 text-foreground sm:rotate-0"
        />
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-foreground">
            Your daily edition
          </p>
          <div className="onboarding-edition border border-muted-foreground bg-background p-5">
            <p className="wordmark text-[10px]">THE FORWARD PASS</p>
            <p className="mt-5 text-lg font-medium">Your personal issue</p>
            <div className="my-5 border-y border-border py-4">
              {[85, 100, 65, 90].map((width, index) => (
                <div
                  key={width}
                  className="onboarding-line my-2.5 h-1 bg-foreground/25"
                  style={{
                    width: `${width}%`,
                    animationDelay: `${index * 200 + 700}ms`,
                  }}
                />
              ))}
            </div>
            <p className="font-mono text-[10px] uppercase leading-5 tracking-wide text-foreground">
              {topics.slice(0, 3).join(" / ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
