import { NextResponse } from "next/server";
import { z } from "zod";
import { preferencesCookieName, verifyPreferencesToken } from "@/lib/preferences-token";

export async function POST(request: Request): Promise<Response> {
  let token: string;
  try {
    token = z.object({ token: z.string().max(2048) }).parse(await request.json()).token;
  } catch {
    return new Response("Invalid link", { status: 400 });
  }
  const verified = verifyPreferencesToken(token);
  if (!verified) return new Response("Invalid or expired link", { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(preferencesCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(1, Math.floor((verified.expires - Date.now()) / 1000)),
  });
  return response;
}
