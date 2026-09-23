import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
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

export const metadata: Metadata = {
  title: "The Forward Pass: What's changing in AI engineering",
  description: "A daily intelligence newsletter for people who build with AI.",
  openGraph: {
    title: "The Forward Pass",
    description: "What's changing in AI engineering.",
    type: "website",
  },
  twitter: {
    card: "summary",
    site: "@forwardpassnews",
  },
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
      className={`${editorial.variable} ${ui.variable} ${technical.variable}`}
    >
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
