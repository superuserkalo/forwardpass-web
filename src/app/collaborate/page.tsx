import type { Metadata } from "next";
import Home from "@/app/page";

export const metadata: Metadata = {
  title: "The Forward Pass: Collaborate",
  description: "Advertising and sponsorship in The Forward Pass.",
  openGraph: {
    title: "The Forward Pass: Collaborate",
    description: "Advertising and sponsorship in The Forward Pass.",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
};

export default function Collaborate() {
  return <Home />;
}
