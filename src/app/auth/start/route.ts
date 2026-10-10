import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { authReturnPath, workosConfigured } from "@/lib/auth-config";

export async function GET(request: Request) {
  if (!workosConfigured()) redirect("/signin?error=unavailable");
  const next = authReturnPath(new URL(request.url).searchParams.get("next"));
  redirect(await getSignInUrl({ returnTo: next, state: JSON.stringify({ newsletter: false }) }));
}
