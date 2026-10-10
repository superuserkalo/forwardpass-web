"use server";

import { getSignInUrl, getSignUpUrl, signOut } from "@workos-inc/authkit-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authReturnPath, workosConfigured } from "./auth-config";
import { preferencesCookieName } from "./preferences-token";

export async function beginAuthAction(form: FormData): Promise<void> {
  const mode = form.get("mode") === "signup" ? "signup" : "signin";
  if (!workosConfigured()) redirect(`/${mode}?error=unavailable`);
  const requestedProvider = form.get("provider");
  const provider = requestedProvider === "google" || requestedProvider === "github" ? requestedProvider : "email";
  const email = provider === "email" ? z.email().max(254).parse(String(form.get("email")).trim().toLowerCase()) : undefined;
  const options = {
    loginHint: email,
    returnTo: authReturnPath(form.get("next")),
    state: JSON.stringify({ newsletter: mode === "signup" && form.get("newsletter") === "on" }),
  };
  const url = new URL(await (mode === "signup" ? getSignUpUrl(options) : getSignInUrl(options)));
  // Keep AuthKit's sealed state and PKCE verifier. WorkOS handles social OAuth
  // and uses the same callback/session exchange as hosted email authentication.
  if (provider !== "email") {
    url.searchParams.set("provider", provider === "github" ? "GitHubOAuth" : "GoogleOAuth");
    url.searchParams.delete("screen_hint");
  }
  redirect(url.toString());
}

export async function signOutAction(): Promise<void> {
  (await cookies()).delete(preferencesCookieName);
  if (workosConfigured()) await signOut();
  redirect("/");
}
