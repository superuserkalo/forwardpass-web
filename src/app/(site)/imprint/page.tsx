import type { Metadata } from "next";
import Link from "next/link";
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
    <LegalPage active="/imprint" title="Imprint" lede={<p>The Forward Pass is an independent publication about AI engineering.</p>}>
        <h2>Contact</h2>
        <p>
          Email: <Link href="/contact">hello@withradian.com</Link>
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
