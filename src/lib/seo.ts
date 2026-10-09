import type { Metadata } from "next";

export const SITE_URL = "https://theforwardpass.net";
export const SITE_NAME = "The Forward Pass";
export const SITE_DESCRIPTION = "A daily intelligence newsletter for people who build with AI.";

// Child metadata replaces the parent's openGraph object, which drops the file-based image, so pages name it.
export const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "The Forward Pass: What's changing in AI engineering." };

export const SOCIAL_PROFILES = [
  "https://x.com/forwardpassnews",
  "https://instagram.com/forwardpassnews",
  "https://www.threads.com/@forwardpassnews",
  "https://www.linkedin.com/company/forwardpassnews",
];

// RSS autodiscovery. Child metadata replaces the parent's alternates object, so pages spread this in.
export const FEED_TYPES = { "application/rss+xml": [{ url: "/feed.xml", title: SITE_NAME }] };

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
    alternates: { canonical: path, types: FEED_TYPES },
    openGraph: { url: path, siteName: SITE_NAME, title, description, type: "website", locale: "en_US", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", site: "@forwardpassnews", title, description, images: [OG_IMAGE.url] },
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
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "hello@withradian.com",
    availableLanguage: "English",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "Inge-Konradi-Gasse 12/1/50",
    addressLocality: "Vienna",
    addressCountry: "AT",
  },
  publishingPrinciples: `${SITE_URL}/about`,
  sameAs: SOCIAL_PROFILES,
};

// Standalone Organization record for the homepage; crawlers that skip @graph still find who publishes the site.
export const homeOrganizationJsonLd = { ...organizationJsonLd, "@type": "Organization" };

// JSON.stringify leaves "<" intact, so a "</script>" inside content could close the tag.
export function serializeJsonLd(data: object): string {
  return JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c");
}
