import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Forward Pass — What's changing in AI engineering",
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
