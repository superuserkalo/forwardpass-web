import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/terms",
  title: "Terms of Service",
  description:
    "The terms that apply when you read The Forward Pass, subscribe to the newsletter or buy a Personal or Professional plan.",
});

export default function Terms() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      updated="3 October 2026"
      lede={
        <p>
          These terms apply to this website, the daily newsletter and the paid Personal and Professional plans.
          By using them you agree to these terms. If you don&apos;t, please don&apos;t use them.
        </p>
      }
    >
      <h2>Who we are</h2>
      <p>
        The Forward Pass is published by Kaloyan Gamtchev, sole proprietorship, Inge-Konradi-Gasse 12/1/50,
        Vienna, Austria (see the <Link href="/imprint">Imprint</Link>), and is operated together with Radian.
        Questions about these terms: <a href="mailto:hello@withradian.com">hello@withradian.com</a>.
      </p>

      <h2>The service</h2>
      <ul>
        <li>The free daily issue and the public archive, available to everyone.</li>
        <li>Personal and Professional plans: an issue written to the reading brief you provide, and for Professional, weekly research on that brief.</li>
        <li>Editorial articles, which carry their author&apos;s name and date.</li>
      </ul>
      <p>
        We may change, pause or stop any part of the service as it develops.
      </p>

      <h2>AI-generated content</h2>
      <p>
        Daily and weekly issues are produced by an automated editorial pipeline and checked against their
        sources. Every story links to its primary source, and <Link href="/about">About</Link> explains how
        each issue is made. Checks reduce errors but cannot remove them. An issue is information, not
        professional, legal, financial or technical advice, and you remain responsible for decisions you
        make using it. If you find a mistake, email us with the issue date and the source.
      </p>

      <h2>Subscriptions and billing</h2>
      <ul>
        <li>Joining the free newsletter requires confirming your email address by the link we send you. You can unsubscribe at any time from any issue or on the <Link href="/unsubscribe">unsubscribe page</Link>.</li>
        <li>New subscribers get a 14-day Personal trial. It needs no card and does not turn into a paid plan unless you choose one.</li>
        <li>Paid plans renew until you cancel. Prices are shown at checkout, and billing, payment, VAT and sales tax are handled by our payment provider, Polar.</li>
        <li>You can cancel at any time in the Polar billing portal. Cancelling stops the next renewal, and you keep the plan until the end of the period you paid for.</li>
        <li>Nothing in these terms limits any right of withdrawal or refund you have by law.</li>
      </ul>

      <h2>Using the site</h2>
      <p>Please don&apos;t:</p>
      <ul>
        <li>scrape, copy or republish issues or the archive at scale, or use them to train or build a competing product, without our written permission;</li>
        <li>share a personal reading session, sign-in link or paid access with people who haven&apos;t subscribed;</li>
        <li>attempt to disrupt, probe or bypass the security of the site, including its bot checks;</li>
        <li>use the contact or advertising forms to send spam or unlawful content.</li>
      </ul>
      <p>You may quote short excerpts with a clear link back to the original page.</p>

      <h2>Intellectual property</h2>
      <p>
        The Forward Pass name, logo, design and text are ours or our licensors&apos;. Third-party names and
        trademarks mentioned in issues belong to their owners and are used to report on them. Each story links
        to the source it reports on, which remains the property of its publisher.
      </p>

      <h2>Advertising and sponsorship</h2>
      <p>
        The free issue is sponsored, and paid plans are ad-free, as described on the{" "}
        <Link href="/pricing">pricing page</Link>. Advertising and sponsorship enquiries go through{" "}
        <Link href="/advertise">Advertise</Link>.
      </p>

      <h2>Links to other sites</h2>
      <p>
        Issues link to external sites we don&apos;t control. We aren&apos;t responsible for their content,
        availability or privacy practices.
      </p>

      <h2>Availability and liability</h2>
      <p>
        We aim to keep the service running and publish every day, but we don&apos;t promise uninterrupted or
        error-free service. To the extent the law allows, we are not liable for indirect or consequential
        loss, or for loss of profit or data, and our total liability for a paid plan is limited to the
        fees you paid for it in the 12 months before the claim. None of this limits liability for intent or
        gross negligence, for injury to life, body or health, or any liability that cannot be excluded under
        mandatory law, including consumer protection law.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by Austrian law, excluding its conflict-of-law rules and the UN Sales
        Convention. If you are a consumer, you keep the protection of the mandatory laws of the country where
        you live, and you may also bring a claim in the courts there. Otherwise the courts of Vienna, Austria
        are responsible.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms as the service changes. The date above shows the latest version, and
        continuing to use the service after an update means you accept the updated terms. How we handle your data is described in the{" "}
        <Link href="/privacy">Privacy</Link> page.
      </p>
    </LegalPage>
  );
}
