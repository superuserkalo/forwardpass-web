import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Imprint — The Forward Pass",
  description: "Publisher information for The Forward Pass.",
  openGraph: {
    title: "Imprint — The Forward Pass",
    description: "Publisher information for The Forward Pass.",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
};

export default function Imprint() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 md:px-10 md:py-16">
      <Link href="/" className="wordmark">THE FORWARD PASS</Link>
      <article className="legal-copy">
        <h1>Imprint</h1>
        <p>The Forward Pass is an independent publication about AI engineering.</p>

        <h2>Contact</h2>
        <p>
          Email: <a href="mailto:hello@withradian.com">hello@withradian.com</a>
        </p>

        <h2>Responsible for content</h2>
        <p>
          Kaloyan Gamtchev
          <br />
          Inge-Konradi-Gasse 12/1/50
          <br />
          Vienna, Austria
        </p>
        <p>Sole proprietorship.</p>
      </article>
    </main>
  );
}
