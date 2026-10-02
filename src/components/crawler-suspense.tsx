import { headers } from "next/headers";
import { Suspense, type ReactNode } from "react";
import { isCrawler } from "@/lib/crawler";

// Streams behind a fallback for people; renders inline for crawlers so the content sits in document order.
export async function CrawlerSuspense({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  if (isCrawler((await headers()).get("user-agent"))) return children;
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
