import type { Metadata } from "next";
import Home from "@/app/(site)/page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/advertise",
  title: "Advertise",
  description:
    "Advertising and sponsorship in The Forward Pass, the daily newsletter for people who build with AI.",
});

export default function Advertise() {
  return <Home />;
}
