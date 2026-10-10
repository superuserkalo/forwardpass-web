import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { AuthenticationException } from "@workos-inc/node";
import { unsealData } from "iron-session";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { authReturnPath } from "./auth-config";

const authStateSchema = z.object({
  nonce: z.string(),
  codeVerifier: z.string(),
  customState: z.string().optional(),
  returnPathname: z.string().optional(),
});

/** Let hosted AuthKit finish email verification after a direct social login. */
export async function emailVerificationUrl(error: unknown, request: NextRequest): Promise<string | null> {
  if (!(error instanceof AuthenticationException) || error.code !== "email_verification_required") return null;
  const identity = z.object({ email: z.email().max(254) }).safeParse(error.rawData);
  const sealedState = request.nextUrl.searchParams.get("state");
  if (!identity.success || !sealedState) return null;
  // Recover only state tied to this browser's SDK verifier cookie.
  const matched = request.cookies.getAll().some(({ name, value }) =>
    (name === "wos-auth-verifier" || name.startsWith("wos-auth-verifier-")) && value === sealedState,
  );
  if (!matched) return null;
  let state: z.infer<typeof authStateSchema>;
  try {
    state = authStateSchema.parse(await unsealData<unknown>(sealedState, { password: process.env.WORKOS_COOKIE_PASSWORD ?? "" }));
  } catch {
    return null;
  }
  return getSignInUrl({
    loginHint: identity.data.email,
    returnTo: authReturnPath(state.returnPathname),
    state: state.customState,
  });
}
