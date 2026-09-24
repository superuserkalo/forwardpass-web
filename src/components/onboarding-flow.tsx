"use client";

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
import { ArrowLeft, ArrowRight, Check, Mail } from "lucide-react";
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
const labels = [
  "About you",
  "Your topics",
  "Your edition",
  "How it works",
  "Your first 14 days",
];
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
  const [step, setStep] = useState(saved ? 4 : 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(saved?.result ?? null);
  const heading = useRef<HTMLHeadingElement>(null);
  const finishBuild = useCallback(() => setSaving(false), []);
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
  }, [step, result, saving]);

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
    setStep((current) => current + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function finish(choice: "trial" | "free") {
    setError("");
    setSaving(true);
    window.scrollTo({ top: 0, behavior: "instant" });
    try {
      const saved = await completeOnboardingAction(profile, choice);
      setResult(saved);
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
    }
  }

  return (
    <div className="min-h-screen bg-background [color-scheme:dark]">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-6 md:px-10">
          <Link href="/" className="wordmark">
            THE FORWARD PASS
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 pb-16 pt-9 md:pt-14">
        <div className="mb-9 md:mb-12">
          <div className="mb-4 flex justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>{result && !saving ? "You're all set" : `Step ${step + 1} of 5`}</span>
            <span>{labels[step]}</span>
          </div>
          <div
            role="progressbar"
            aria-label="Onboarding progress"
            aria-valuemin={0}
            aria-valuemax={5}
            aria-valuenow={result ? 5 : step + 1}
            className="grid grid-cols-5 gap-2"
          >
            {labels.map((label, index) => (
              <div
                key={label}
                className={`h-[2px] transition-colors duration-500 ${index <= step ? "bg-foreground" : "bg-border"}`}
              />
            ))}
          </div>
        </div>
        <section className="border border-border bg-card p-6 sm:p-10 md:p-12">
          {saving ? (
            <OnboardingBuild
              profile={profile}
              saved={result !== null}
              onComplete={finishBuild}
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
                      "Your first 14 days of Personal are on us.",
                    ][step]
                  }
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                  {
                    [
                      "Tell us a little about your work. We'll use it to shape your reading brief.",
                      "Pick the topics you care about. We'll use these to filter your Personal edition.",
                      "Choose a short briefing or a list of headlines and primary sources.",
                      "We research what's changing in AI engineering. Your brief tells us what belongs in your edition.",
                      "Try an issue written to your interests. No credit card needed. You decide whether to keep it after day 14.",
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
                        <Field label="Seniority · optional">
                          <select
                            className={inputClass}
                            value={profile.seniority}
                            onChange={(event) =>
                              update(
                                "seniority",
                                event.target
                                  .value as ReadingProfile["seniority"],
                              )
                            }
                          >
                            <option value="">Select your level</option>
                            {SENIORITY.map((level) => (
                              <option key={level}>{level}</option>
                            ))}
                          </select>
                        </Field>
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
                {step === 4 && (
                  <div className="mt-9">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="border border-muted-foreground bg-background p-6">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-foreground">
                          Personalized
                        </p>
                        <h2 className="mt-4 text-2xl">Personal</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Free for 14 days
                        </p>
                        <FeatureList
                          items={[
                            "An issue written to your interests",
                            "Ad-free daily reading",
                            "Briefing or links-only format",
                          ]}
                        />
                        <div className="mt-6 border-t border-border pt-5">
                          <p className="text-sm">
                            For {profile.firstName},{" "}
                            {profile.role.toLowerCase()}
                          </p>
                          <p className="mt-3 font-mono text-[10px] uppercase leading-6 tracking-wide text-foreground">
                            {profile.topics.join(" · ")}
                          </p>
                        </div>
                      </div>
                      <div className="border border-border p-6">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          General
                        </p>
                        <h2 className="mt-4 text-2xl">Free</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          $0, always
                        </p>
                        <FeatureList
                          items={[
                            "The general daily issue",
                            "Curated AI-engineering sources",
                            "Supported by sponsors",
                          ]}
                        />
                        <p className="mt-6 border-t border-border pt-5 text-sm leading-6 text-muted-foreground">
                          Your trial returns to Free automatically. Upgrade only
                          if you want to.
                        </p>
                      </div>
                    </div>
                    <p className="mt-5 text-xs leading-6 text-muted-foreground">
                      Keep Personal for $4.99/month after your trial, or choose
                      Professional for $9.99/month with weekly deep research.{" "}
                      <Link
                        href="/pricing"
                        target="_blank"
                        className="underline underline-offset-4"
                      >
                        Compare plans
                      </Link>
                      .
                    </p>
                  </div>
                )}
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
                {step < 4 ? (
                  <button className={buttonClass} type="submit">
                    Continue <ArrowRight className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => finish("trial")}
                  >
                    Start my 14 free days <ArrowRight className="size-4" />
                  </button>
                )}
              </div>
              {step === 4 && (
                <button
                  type="button"
                  onClick={() => finish("free")}
                  className="mx-auto mt-6 block min-h-11 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Stay on Free
                </button>
              )}
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
function EditionPreview({ topics }: { topics: string[] }) {
  return (
    <div className="mt-10">
      <div
        className="grid items-center gap-5 sm:grid-cols-[1fr_40px_1fr]"
        aria-label="Illustration of research becoming your personal daily edition"
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
          className="mx-auto size-6 rotate-90 text-muted-foreground sm:rotate-0"
        />
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-foreground">
            Your daily edition
          </p>
          <div className="border border-muted-foreground bg-background p-5">
            <p className="wordmark text-[10px]">THE FORWARD PASS</p>
            <p className="mt-5 text-lg font-medium">Your personal issue</p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              Selected from the day’s research.
            </p>
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
      <p className="mt-5 text-xs leading-6 text-muted-foreground">
        Illustration. Your selections shape your reading brief for Personal. The
        Free edition stays general.
      </p>
    </div>
  );
}
