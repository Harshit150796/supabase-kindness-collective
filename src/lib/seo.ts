/** Shared search helpers: the canonical address of a page, snippet trimming and structured data. */

export const SITE = "https://coupondonation.com";
export const DEFAULT_SHARE_IMAGE = `${SITE}/og-image.png`;

/** One canonical form per page: no query string, no hash, no trailing slash (except the homepage). */
export function canonicalUrl(path: string) {
  const clean = (path || "/").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return `${SITE}${clean.startsWith("/") ? clean : `/${clean}`}`;
}

/** Search snippets stop around 155 characters; cut on a word and never mid-sentence noise. */
export function snippet(text: string, max = 155) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).replace(/[,;:.\s]+$/, "")}…`;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

/** Question-and-answer structured data that matches answers shown in full on the page. */
export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
