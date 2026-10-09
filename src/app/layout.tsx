import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Geist, Geist_Mono, Newsreader } from "next/font/google";
import { FEED_TYPES, OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

export const viewport: Viewport = {
  colorScheme: "light",
};

const editorial = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

const ui = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const technical = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const brand = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  weight: "600",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Forward Pass: What's changing in AI engineering",
    template: "%s | The Forward Pass",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    title: "The Forward Pass",
    description: "What's changing in AI engineering.",
    type: "website",
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    site: "@forwardpassnews",
    images: [OG_IMAGE.url],
  },
  other: {
    "darkreader-lock": "",
    // An editorial site: pins the agent-readiness report to the content checks, which the scanner otherwise infers and gets wrong.
    "is-agentic-site-type": "content",
  },
  alternates: { types: FEED_TYPES },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${editorial.variable} ${ui.variable} ${technical.variable} ${brand.variable}`}
    >
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
