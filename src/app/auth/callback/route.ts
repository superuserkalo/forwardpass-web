import { handleAuth } from "@workos-inc/authkit-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { syncAccount } from "@/lib/account-sync";
import { preferencesCookieName } from "@/lib/preferences-token";

export const GET = handleAuth({
  returnPathname: "/auth/complete",
  onSuccess: async ({ user, state }) => {
    await syncAccount(user, state);
    (await cookies()).delete(preferencesCookieName);
  },
  onError: ({ request }) => NextResponse.redirect(new URL("/signin?error=callback", request.url)),
});
