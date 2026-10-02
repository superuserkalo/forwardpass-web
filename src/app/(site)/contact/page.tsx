import type { Metadata } from "next";
import Home from "@/app/(site)/page";

export const metadata: Metadata = {
  title: "The Forward Pass: Contact",
  description: "Get in touch with The Forward Pass.",
  openGraph: {
    title: "The Forward Pass: Contact",
    description: "Get in touch with The Forward Pass.",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
};

export default function Contact() {
  return <Home />;
}
