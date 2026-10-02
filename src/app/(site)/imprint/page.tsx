import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/imprint",
  title: "Imprint",
  description:
    "Publisher information for The Forward Pass.",
});

export default function Imprint() {
  return (
    <LegalPage eyebrow="Legal" title="Imprint" lede={<p>The Forward Pass is an independent publication about AI engineering.</p>}>
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
    </LegalPage>
  );
}
