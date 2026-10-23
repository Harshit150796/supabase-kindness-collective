// Builds sitemaps. The live fundraiser sitemap is served from a Supabase function, and Supabase serves
// every function response as text/plain, so it uses the plain-text sitemap format that Google and Bing
// both accept (one absolute URL per line, UTF-8). sitemapXml stays for XML sitemaps served elsewhere.
export interface SitemapEntry {
  loc: string;
  lastmod?: string | null;
}

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** A date the sitemap can carry (W3C datetime, date part), or nothing for unknown values. */
export function lastmodDate(value?: string | null): string | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString().slice(0, 10) : null;
}

export function sitemapXml(entries: SitemapEntry[]): string {
  const seen = new Set<string>();
  const rows: string[] = [];
  for (const entry of entries) {
    if (!/^https:\/\/coupondonation\.com\//.test(entry.loc) || seen.has(entry.loc)) continue;
    seen.add(entry.loc);
    const date = lastmodDate(entry.lastmod);
    rows.push(`  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${date ? `\n    <lastmod>${date}</lastmod>` : ""}\n  </url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}${rows.length ? "\n" : ""}</urlset>\n`;
}

/** Plain-text sitemap: one of our absolute URLs per line, no duplicates, at most 50,000. */
export function sitemapText(entries: SitemapEntry[]): string {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (/^https:\/\/coupondonation\.com\/\S*$/.test(entry.loc)) seen.add(entry.loc);
    if (seen.size >= 50000) break;
  }
  return seen.size ? `${[...seen].join("\n")}\n` : "";
}
