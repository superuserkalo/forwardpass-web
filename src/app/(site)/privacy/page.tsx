import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/privacy",
  title: "Privacy Policy",
  description:
    "How The Forward Pass handles subscriber data, payments, and cookies.",
});

export default function Privacy() {
  return (
    <LegalPage
      active="/privacy"
      title="Privacy Policy"
      lede={
        <p>
          The Forward Pass is published by Kaloyan Gamtchev, sole proprietorship (see the{" "}
          <Link href="/imprint">Imprint</Link>), and is operated together with Radian. This page explains
          what we collect, why, and how to opt out.
        </p>
      }
    >
        <h2>Who is responsible</h2>
        <p>
          Kaloyan Gamtchev, Inge-Konradi-Gasse 12/1/50, Vienna, Austria. Questions about your data:{" "}
          <a href="mailto:hello@withradian.com">hello@withradian.com</a>.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>Newsletter: your email address and signup date. If you complete onboarding, we also store your name, role, optional seniority and company, topics, preferred content and format, reading brief, and Personal trial dates to personalize your edition.</li>
          <li>Chat delivery: if you connect Slack, Discord, Telegram or Microsoft Teams, we store the selected platform, conversation and workspace identifiers, the connecting platform user, your confirmation and delivery settings, and delivery acknowledgements alongside your email account. Slack installation tokens are encrypted. Connection codes expire after ten minutes. A confirmed personal Slack connection also identifies your account for coverage tools in Slackbot, using your existing plan and agent credits. We verify signed caller identity from Slack. Shared channels do not grant members access to the account of the channel owner. Disconnecting your personal Slack destination revokes this account link; pausing daily delivery preserves it.</li>
          <li>Agent access: if you create an MCP key, we store its hash, creation date, and the associated email address in Cloudflare R2. We keep credit balances, payment and refund identifiers, and any auto-refill settings in Cloudflare Durable Objects to enforce allowances and prevent duplicate charges. Card details stay with Polar. Your reading brief can filter agent updates. Search terms are processed to return coverage; we do not save them as account history. You can replace or revoke your key from the agent access page.</li>
          <li>
            Advertising inquiries: your name, work email, company, company website, what you want to
            promote, and your approximate budget if you share it.
          </li>
          <li>
            Contact messages: your name, email address and the message you send through the contact form.
          </li>
          <li>
            Email engagement: whether an issue was opened and which links were clicked, so we can
            improve the newsletter and report reach to sponsors in aggregate.
          </li>
        </ul>

        <h2>Why we use it</h2>
        <ul>
          <li>To send you the daily newsletter you asked for.</li>
          <li>To answer your advertising or sponsorship inquiry, or your contact message.</li>
          <li>
            To include sponsorships and promotional placements within the newsletter. Joining the
            newsletter does not subscribe you to separate Radian product or sales emails.
          </li>
          <li>To produce aggregate statistics about the audience, such as total subscribers.</li>
        </ul>
        <p>
          The legal bases are your consent for the newsletter, including its sponsorships, performance of a
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

        <p>
          Connected chat destinations are managed in Cloudflare Durable Objects, with delivery summaries
          in Cloudflare R2. Your chosen messaging platform receives the digest and the identifiers needed
          to deliver it. Its own privacy policy applies to messages in your inbox or shared conversation.
          Shared destinations make the digest visible to members who can access that conversation.
        </p>

        <p>
          We also use Cloudflare Turnstile to protect forms from bots and abuse, based on our legitimate
          interest in keeping the service secure. For newsletter signup, the check starts when you enter
          your email or submit the form. Cloudflare processes technical signals such as your IP address,
          browser information and site origin, not the email entered in the form. Cloudflare acts as a
          processor for site protection and as a controller for improving its bot detection, as described
          in its <a href="https://www.cloudflare.com/turnstile-privacy-policy/">Turnstile Privacy Addendum</a>.
        </p>

        <h2>How long we keep it</h2>
        <p>
          Newsletter contacts are kept until you unsubscribe or ask for deletion. Advertising inquiries
          are kept for as long as needed for the conversation and any resulting business relationship.
        </p>

        <h2>Your choices</h2>
        <p>
          You can confirm, pause or disconnect each chat destination in your{" "}
          <Link href="/preferences#delivery">reading brief</Link>. Email and chat delivery are managed
          separately. Disconnecting stops future chat delivery; it does not delete messages already sent
          on the messaging platform. Ask us for deletion of retained connection and delivery records using
          the contact below.
        </p>
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
    </LegalPage>
  );
}
