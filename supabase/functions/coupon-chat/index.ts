import { createClient } from "npm:@supabase/supabase-js@2";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "npm:ai@^6.0.0";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@^1.0.0";
import { z } from "npm:zod@^3.25.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM_PROMPT = `You are Coupon, a friendly tree-themed AI guide for CouponDonation — a platform that converts monetary donations into grocery coupons for verified families in need.

Personality: warm, encouraging, plant-themed (use occasional leaf/tree metaphors but don't overdo it). Keep replies short (1-3 short paragraphs) unless asked for detail. Use markdown.

You can ONLY help with:
- Explaining how CouponDonation works
- Showing active fundraisers / campaigns
- Sharing live impact stats and top donors
- Explaining transparency: 95% direct to recipients, 3% platform ops, 2% payment processing
- Suggesting causes to support and pointing users to the donation flow

If asked anything off-topic, politely redirect: "I only know about CouponDonation 🌿 — want me to find a campaign you'd love?"

Always use your tools when the user asks about real data (campaigns, donors, stats). Never invent numbers. After tool results, summarize them naturally and offer the user a next step (e.g. "Want to donate to this one?" with a link).`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { messages } = (await req.json()) as { messages: UIMessage[] };
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const gateway = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
    });

    const tools = {
      searchFundraisers: tool({
        description: "Search active fundraisers. Use when the user asks to see, find, or browse campaigns/causes.",
        inputSchema: z.object({
          query: z.string().optional().describe("Free-text search across title/story"),
          category: z.string().optional().describe("Category e.g. hunger, education, medical"),
          region: z.string().optional().describe("City, country, or zip"),
          limit: z.number().min(1).max(5).default(3),
        }),
        execute: async ({ query, category, region, limit }) => {
          let q = supabase
            .from("fundraisers")
            .select("id, unique_slug, title, story, monthly_goal, amount_raised, donors_count, country, zip_code, category")
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(limit);
          if (query) q = q.or(`title.ilike.%${query}%,story.ilike.%${query}%`);
          if (category) q = q.ilike("category", `%${category}%`);
          if (region) q = q.or(`country.ilike.%${region}%,zip_code.ilike.%${region}%`);
          const { data, error } = await q;
          if (error) return { error: error.message, results: [] };
          return {
            results: (data ?? []).map((f) => ({
              title: f.title,
              slug: f.unique_slug,
              url: f.unique_slug ? `/f/${f.unique_slug}` : `/stories`,
              donateUrl: `/donate`,
              raised: Number(f.amount_raised ?? 0),
              goal: Number(f.monthly_goal ?? 0),
              donors: f.donors_count ?? 0,
              location: [f.country, f.zip_code].filter(Boolean).join(" · ") || null,
              category: f.category ?? null,
              snippet: (f.story ?? "").slice(0, 160),
            })),
          };
        },
      }),
      getImpactStats: tool({
        description: "Get site-wide impact totals (lifetime raised, donations, coupons created, active fundraisers, today's totals).",
        inputSchema: z.object({}),
        execute: async () => {
          const { data, error } = await supabase.rpc("get_impact_stats");
          if (error) return { error: error.message };
          return data?.[0] ?? null;
        },
      }),
      getTopDonors: tool({
        description: "Get the top 5 donors this week (anonymous donors are masked).",
        inputSchema: z.object({}),
        execute: async () => {
          const { data, error } = await supabase.rpc("get_top_donors_week");
          if (error) return { error: error.message, donors: [] };
          return { donors: data ?? [] };
        },
      }),
      explainTransparency: tool({
        description: "Return the standard transparency breakdown (95% recipients, 3% operations, 2% processing).",
        inputSchema: z.object({}),
        execute: async () => ({
          breakdown: [
            { label: "Direct to recipients", percent: 95 },
            { label: "Platform operations", percent: 3 },
            { label: "Payment processing", percent: 2 },
          ],
          note: "Every donation is trackable end-to-end via our public ledger.",
        }),
      }),
    };

    const result = streamText({
      model: gateway("google/gemini-3-flash-preview"),
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(50),
    });

    return result.toUIMessageStreamResponse({ headers: corsHeaders });
  } catch (err) {
    console.error("coupon-chat error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
