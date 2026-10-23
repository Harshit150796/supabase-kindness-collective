// Builds sitemap XML (sitemaps.org 0.9). Google reads <loc> and an accurate <lastmod>; it ignores
// priority and changefreq, so they are left out.
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
