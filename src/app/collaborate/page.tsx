import type { Metadata } from "next";
import Home from "@/app/page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/collaborate",
  title: "Collaborate",
  description:
    "Advertising and sponsorship in The Forward Pass, the daily newsletter for people who build with AI.",
});

export default function Collaborate() {
  return <Home />;
}
