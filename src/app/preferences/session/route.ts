import { NextResponse } from "next/server";
import { z } from "zod";
import { joinNewsletter } from "@/lib/newsletter";
import { exchangeLinkToken } from "@/lib/session-exchange";
import { preferencesCookieName } from "@/lib/preferences-token";

export async function POST(request: Request): Promise<Response> {
  let token: string;
  try {
    token = z.object({ token: z.string().max(2048) }).parse(await request.json()).token;
  } catch {
    return new Response("Invalid link", { status: 400 });
  }
  const session = exchangeLinkToken(token);
  if (!session) return new Response("Invalid or expired link", { status: 401 });
  if (session.subscribeEmail) {
    // Following the confirmation link proves the inbox, so this is where the address is subscribed.
    try {
      await joinNewsletter(session.subscribeEmail);
    } catch (error) {
      console.error("Newsletter confirmation failed", error);
      return new Response("Could not confirm your subscription. Please open the link again.", { status: 500 });
    }
  }
  const response = NextResponse.json({ ok: true, next: session.next });
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(preferencesCookieName, session.cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAgeSeconds,
  });
  return response;
}
