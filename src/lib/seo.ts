import type { Metadata } from "next";

export const SITE_URL = "https://theforwardpass.net";
export const SITE_NAME = "The Forward Pass";
export const SITE_DESCRIPTION = "A daily intelligence newsletter for people who build with AI.";

export const SOCIAL_PROFILES = [
  "https://x.com/forwardpassnews",
  "https://instagram.com/forwardpassnews",
  "https://www.threads.com/@forwardpassnews",
  "https://www.linkedin.com/company/forwardpassnews",
];

// Child metadata replaces the parent's openGraph object wholesale, so every page restates it.
export function pageMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { url: path, siteName: SITE_NAME, title, description, type: "website", locale: "en_US" },
    twitter: { card: "summary_large_image", site: "@forwardpassnews", title, description },
  };
}

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export const organizationJsonLd = {
  "@type": "NewsMediaOrganization",
  "@id": ORGANIZATION_ID,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: SITE_DESCRIPTION,
  email: "hello@withradian.com",
  sameAs: SOCIAL_PROFILES,
};

// JSON.stringify leaves "<" intact, so a "</script>" inside content could close the tag.
export function serializeJsonLd(data: object): string {
  return JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c");
}
