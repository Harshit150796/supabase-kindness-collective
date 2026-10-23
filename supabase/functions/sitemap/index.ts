// Live sitemap of every open fundraiser and published blog post, listed in robots.txt next to the
// static /sitemap.xml (Google and Bing accept a sitemap on another host when robots.txt names it).
// Public data only, read with the anon key under row-level security; examples and closed campaigns
// stay out of search. Cached for an hour at the edge.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sitemapXml, type SitemapEntry } from "../_shared/sitemap.ts";

const SITE = "https://coupondonation.com";

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const entries: SitemapEntry[] = [];
  try {
    const { data: fundraisers } = await db
      .from("fundraisers")
      .select("unique_slug, updated_at, created_at")
      .eq("status", "active")
      .eq("is_example", false)
      .is("archived_at", null)
      .not("unique_slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(45000);
    for (const f of fundraisers ?? []) {
      entries.push({ loc: `${SITE}/f/${f.unique_slug}`, lastmod: f.updated_at ?? f.created_at });
    }
    const { data: posts } = await db
      .from("cms_posts")
      .select("slug, updated_at, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(4000);
    for (const p of posts ?? []) entries.push({ loc: `${SITE}/blog/${p.slug}`, lastmod: p.updated_at ?? p.published_at });
  } catch (error) {
    console.error("sitemap query failed", error instanceof Error ? error.message : error);
  }
  return new Response(req.method === "HEAD" ? null : sitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
