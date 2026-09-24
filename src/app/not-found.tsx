import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display text-7xl font-medium text-foreground">404</h1>
          <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
