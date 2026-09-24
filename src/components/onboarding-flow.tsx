"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Mail } from "lucide-react";
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
  const [building, setBuilding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(saved?.result ?? null);
  const heading = useRef<HTMLHeadingElement>(null);
  const finishBuild = useCallback(() => {
    setBuilding(false);
    setConfirming(true);
  }, []);
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
  }, [step, result, building, confirming]);

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
      setBuilding(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setStep((current) => current + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function confirm() {
    setError("");
    setSaving(true);
    try {
      const saved = await completeOnboardingAction(profile, "trial");
      setResult(saved);
      setConfirming(false);
      window.scrollTo({ top: 0, behavior: "instant" });
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* Optional draft cleanup. */
      }
    } catch {
      setError(
        "We couldn't save your edition. Your selections are still here. Please try again.",
      );
    } finally {
      setSaving(false);
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
            <span>{result ? "You're all set" : confirming ? "Step 5 of 5" : `Step ${step + 1} of 5`}</span>
            <span>{result ? labels[labels.length - 1] : confirming ? "Your first 14 days" : building ? "Preparing your brief" : labels[step]}</span>
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
          {building ? (
            <OnboardingBuild
              next="confirm"
              profile={profile}
              saved={false}
              onComplete={finishBuild}
            />
          ) : confirming ? (
            <TrialOffer
              profile={profile}
              headingRef={heading}
              error={error}
              busy={saving}
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
                      <Choices
                        label="Seniority · optional"
                        options={SENIORITY}
                        selected={profile.seniority ? [profile.seniority] : []}
                        onChange={(value) =>
                          update("seniority", profile.seniority === value ? "" : value)
                        }
                        chips
                        optional
                      />
                    )}
                    {profile.role !== "Student" && (
                      <div>
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
  optional,
}: {
  label: string;
  options: readonly T[];
  selected: T[];
  onChange: (value: T) => void;
  single?: boolean;
  chips?: boolean;
  optional?: boolean;
}) {
  return (
    <fieldset>
      <legend className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label} {!optional && <span className="text-foreground">*</span>}
      </legend>
      <div
        className={chips ? "flex flex-wrap gap-2" : "grid gap-2 sm:grid-cols-2"}
      >
        {options.map((value) => (
          <label
            key={value}
            className={`flex cursor-pointer items-center gap-3 border font-mono text-[11px] uppercase tracking-wider transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-foreground ${chips ? "min-h-10 px-3.5 py-2" : "min-h-12 px-4 py-3"} ${
              selected.includes(value)
                ? chips
                  ? "border-foreground bg-foreground text-background"
                  : "border-muted-foreground bg-white/[0.055] text-foreground"
                : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
            }`}
          >
            <input
              type={single && !optional ? "radio" : "checkbox"}
              name={label}
              checked={selected.includes(value)}
              onChange={() => onChange(value)}
              className={chips ? "sr-only" : "size-3 accent-foreground"}
            />
            {value}
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
  busy,
  onConfirm,
  onBack,
}: {
  profile: ReadingProfile;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  error: string;
  busy: boolean;
  onConfirm: () => void;
  onBack: () => void;
}) {
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
        <button type="button" disabled={busy} className={buttonClass} onClick={onConfirm}>
          {busy ? "Starting your trial" : "Start my 14 free days"}{" "}
          {busy ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <ArrowRight className="size-4" />}
        </button>
      </div>
    </div>
  );
}
const TOPIC_HEADLINES: Record<(typeof TOPICS)[number], string> = {
  Agents: "Agents that run their own evals",
  APIs: "Structured tool calls in the API",
  Audio: "Open speech model matches ASR",
  Benchmarks: "A new long-context benchmark",
  Data: "An open code dataset ships",
  Development: "Editors ship background agents",
  GPUs: "New inference GPUs hit the cloud",
  Image: "Image models render clean text",
  Infrastructure: "Serving latency cut in half",
  LLMs: "A frontier model, longer context",
  "Open source": "Open weights for a 27B coder",
  "Post-training": "Cheaper preference tuning",
  Reasoning: "Test-time compute, measured",
  Retrieval: "Hybrid search beats dense-only",
  Robotics: "Sim-trained robots transfer",
  Security: "Prompt injection in a top agent",
  Training: "A training run on one node",
  Video: "Consistent characters in video",
};

const SCAN_MS = 900;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(listener: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION).matches;
}
const HOLD_TICKS = 4;

/** The day's research, interleaving the reader's topics with ones they did not pick. */
function researchFeed(topics: string[]) {
  const picked = TOPICS.filter((topic) => topics.includes(topic)).slice(0, 3);
  const others = TOPICS.filter((topic) => !topics.includes(topic)).slice(0, 6 - Math.max(picked.length, 1));
  const items: Array<{ topic: (typeof TOPICS)[number]; match: boolean }> = [];
  for (let index = 0; index < Math.max(picked.length, others.length); index += 1) {
    if (others[index]) items.push({ topic: others[index], match: false });
    if (picked[index]) items.push({ topic: picked[index], match: true });
  }
  return items.slice(0, 6);
}

function EditionPreview({ topics }: { topics: string[] }) {
  const items = useMemo(() => researchFeed(topics), [topics]);
  const [step, setStep] = useState(0);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  const cycle = items.length + HOLD_TICKS;
  const tick = reducedMotion ? items.length : step;

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => setStep((current) => (current + 1) % cycle), SCAN_MS);
    return () => window.clearInterval(timer);
  }, [cycle, reducedMotion]);

  const scanned = Math.min(tick, items.length);
  const picked = items.slice(0, scanned).filter((item) => item.match);
  const done = tick >= items.length;

  return (
    <div className="mt-10" aria-label="Research being filtered into your personal edition">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-6">
        <div>
          <p className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            The day&apos;s research
            <span className="tabular-nums">
              {scanned}/{items.length} read
            </span>
          </p>
          <ol className="border border-border">
            {items.map((item, index) => {
              const active = index === tick && !done;
              const read = index < scanned;
              return (
                <li
                  key={item.topic}
                  className={`relative border-b border-border px-4 py-3 transition-[opacity,background-color] duration-500 last:border-b-0 ${
                    active ? "bg-white/[0.06]" : ""
                  } ${read && !item.match ? "opacity-35" : ""}`}
                >
                  <span
                    aria-hidden
                    className={`absolute inset-y-0 left-0 w-px bg-foreground transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0"}`}
                  />
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {item.topic}
                    {read && item.match && <span className="ml-2 text-foreground">· for you</span>}
                  </p>
                  <p className={`mt-1 truncate text-[13px] leading-5 ${read && item.match ? "text-foreground" : "text-muted-foreground"}`}>
                    {TOPIC_HEADLINES[item.topic]}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
        <div>
          <p className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Your edition
            <span className="tabular-nums">{picked.length} stories</span>
          </p>
          <div className={`border p-5 transition-colors duration-500 ${done ? "border-foreground" : "border-border"}`}>
            <p className="wordmark text-[11px]">THE FORWARD PASS</p>
            <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Personal edition
            </p>
            <ol className="mt-4 min-h-32 border-t border-border">
              {picked.map((item, index) => (
                <li key={item.topic} className="onboarding-enter flex gap-3 border-b border-border py-2.5">
                  <span className="font-mono text-[10px] leading-5 text-muted-foreground tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate text-[13px] leading-5 text-foreground">{TOPIC_HEADLINES[item.topic]}</span>
                </li>
              ))}
            </ol>
            <p className={`mt-4 font-mono text-[10px] uppercase tracking-widest transition-colors duration-500 ${done ? "text-foreground" : "text-muted-foreground"}`}>
              {done ? "Ready for tomorrow, 07:00" : "Filtering"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
