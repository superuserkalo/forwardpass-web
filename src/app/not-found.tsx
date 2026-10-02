import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell flex min-h-[80vh] flex-col justify-center pb-24 pt-40">
        <p className="onboarding-eyebrow">Error 404</p>
        <h1 className="font-display text-7xl leading-none font-medium tracking-[-0.02em] sm:text-9xl">Page not found.</h1>
        <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-10 inline-flex h-14 w-fit items-center justify-center whitespace-nowrap bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go home
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
