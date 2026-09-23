import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Forward Pass: Privacy",
  description: "How The Forward Pass handles your data.",
  openGraph: {
    title: "The Forward Pass: Privacy",
    description: "How The Forward Pass handles your data.",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
};

export default function Privacy() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 md:px-10 md:py-16">
      <Link href="/" className="wordmark">THE FORWARD PASS</Link>
      <article className="legal-copy">
        <h1>Privacy</h1>
        <p>
          The Forward Pass is published by Kaloyan Gamtchev, sole proprietorship (see the{" "}
          <Link href="/imprint">Imprint</Link>), and is operated together with Radian. This page explains
          what we collect, why, and how to opt out.
        </p>

        <h2>Who is responsible</h2>
        <p>
          Kaloyan Gamtchev, Inge-Konradi-Gasse 12/1/50, Vienna, Austria. Questions about your data:{" "}
          <a href="mailto:hello@withradian.com">hello@withradian.com</a>.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>Newsletter: your email address, plus the date you subscribed.</li>
          <li>
            Advertising inquiries: your name, work email, company, company website, what you want to
            promote, and your approximate budget if you share it.
          </li>
          <li>
            Email engagement: whether an issue was opened and which links were clicked, so we can
            improve the newsletter and report reach to sponsors in aggregate.
          </li>
        </ul>

        <h2>Why we use it</h2>
        <ul>
          <li>To send you the daily newsletter you asked for.</li>
          <li>To answer your advertising or sponsorship inquiry.</li>
          <li>
            To contact you about The Forward Pass and about related Radian products and services that
            are relevant to people building with AI. These include sponsorship, partnership and product
            offers. In other words, subscribers and inquiries may be used as business leads for Radian.
          </li>
          <li>To produce aggregate statistics about the audience, such as total subscribers.</li>
        </ul>
        <p>
          The legal bases are your consent for the newsletter and marketing contact, performance of a
          contract or pre-contractual steps for advertising inquiries, and our legitimate interest in
          running and growing an independent publication.
        </p>

        <h2>Who processes it</h2>
        <p>
          We use Resend to store contacts and send email, and our hosting provider to serve this site.
          Data may be processed outside the EU under the relevant standard contractual clauses. We do
          not sell your personal information, and we do not share your individual details with
          advertisers.
        </p>

        <h2>How long we keep it</h2>
        <p>
          Newsletter contacts are kept until you unsubscribe or ask for deletion. Advertising inquiries
          are kept for as long as needed for the conversation and any resulting business relationship.
        </p>

        <h2>Your choices</h2>
        <p>
          Every issue includes an unsubscribe link, and you can also{" "}
          <Link href="/unsubscribe">unsubscribe here</Link> at any time. You may request access,
          correction, deletion, or a copy of your data, and object to marketing contact, by emailing{" "}
          <a href="mailto:hello@withradian.com">hello@withradian.com</a>. You can also lodge a
          complaint with the Austrian data protection authority.
        </p>

        <h2>Cookies</h2>
        <p>
          This site does not use advertising or tracking cookies. Only what is needed to serve the page
          is used.
        </p>
      </article>
    </main>
  );
}
