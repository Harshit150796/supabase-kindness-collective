import { Helmet } from "react-helmet-async";
import { DEFAULT_SHARE_IMAGE, canonicalUrl, snippet } from "@/lib/seo";

// Older pages import breadcrumbJsonLd from here.
export { breadcrumbJsonLd } from "@/lib/seo";

/** Structured data object; schema.org shapes vary too much to type usefully. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonLd = Record<string, any>;

interface SEOProps {
  title: string;
  description: string;
  path: string; // e.g. "/about"
  image?: string;
  /** Describes the share image for screen readers and when it can't load. */
  imageAlt?: string;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: JsonLd | JsonLd[];
}

/**
 * Per-page head tags. index.html carries the homepage's defaults marked `data-rh`, so the first page
 * that renders this replaces them; pages that are private or empty pass `noindex`.
 */
export function SEO({
  title,
  description,
  path,
  image = DEFAULT_SHARE_IMAGE,
  imageAlt = "CouponDonation logo with the line Give what people need",
  type = "website",
  noindex = false,
  jsonLd,
}: SEOProps) {
  const url = canonicalUrl(path);
  const fullTitle = title.includes("CouponDonation") ? title : `${title} | CouponDonation`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const desc = snippet(description, 160);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="robots" content={noindex ? "noindex, follow" : "index, follow, max-image-preview:large"} />
      {!noindex && <link rel="canonical" href={url} />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:site_name" content="CouponDonation" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
}

/** Head tags for private or utility pages: a title for the tab, and kept out of search results. */
export function NoIndex({ title, path = "/" }: { title: string; path?: string }) {
  return <SEO title={title} description="CouponDonation" path={path} noindex />;
}
