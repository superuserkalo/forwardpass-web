import type { Metadata } from "next";
import { AdvertisingForm } from "@/components/forward-pass-forms";
import { CollaboratePanel } from "@/components/collaborate-panel";

export const metadata: Metadata = {
  title: "The Forward Pass: Collaborate",
  description: "Advertising and sponsorship in The Forward Pass.",
  openGraph: {
    title: "The Forward Pass: Collaborate",
    description: "Advertising and sponsorship in The Forward Pass.",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
};

export default function Collaborate() {
  return (
    <main className="relative min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center px-5 py-16 md:px-10">
        <CollaboratePanel>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Advertising &amp; sponsorship</p>
          <h1 className="font-display mt-4 max-w-xl text-3xl font-medium leading-tight tracking-[-0.02em] sm:text-4xl">
            Building for AI engineers?
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Reach an audience of AI engineers, researchers, technical founders and people building the next generation of AI systems.
          </p>
          <AdvertisingForm />
        </CollaboratePanel>
      </div>
    </main>
  );
}
