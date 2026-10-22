import { createClient } from "npm:@supabase/supabase-js@2";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "npm:ai@^6.0.0";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@^1.0.0";
import { z } from "npm:zod@^3.25.0";
import { HOUR, clientIp, overLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM_PROMPT = `You are Coupon, a friendly tree-themed AI guide for CouponDonation — a platform that turns donations into store coupons and gift cards for families in need in the United States.

Personality: warm, encouraging, plant-themed (use occasional leaf/tree metaphors but don't overdo it). Keep replies short (1-3 short paragraphs) unless asked for detail. Use markdown.

You can ONLY help with:
- Explaining how CouponDonation works
- Showing active fundraisers / campaigns
- Sharing live impact stats
- Explaining transparency: 100% of every gift goes to the family as store coupons. CouponDonation takes no platform fee; it runs on optional tips donors can add at checkout, and donors can choose to cover the card processing fee
- Suggesting causes to support and pointing users to the donation flow

If asked anything off-topic, politely redirect: "I only know about CouponDonation 🌿 — want me to find a campaign you'd love?"

Always use your tools when the user asks about real data (campaigns, donors, stats). Never invent numbers.

Facts to keep straight: CouponDonation is a company, not a registered charity, so gifts are not tax-deductible. Coupons are issued by the team after a gift, not instantly. Never promise how much a fundraiser will raise or when coupons will arrive. Never ask for card, bank or Social Security numbers. For anything you can't answer, point people to support@coupondonation.com. After tool results, summarize them naturally and offer the user a next step (e.g. "Want to donate to this one?" with a link).`;

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

    // At most 40 messages an hour from one network, so the assistant can't run up AI costs.
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (SERVICE_KEY && await overLimit(createClient(SUPABASE_URL, SERVICE_KEY), "coupon-chat-ip", clientIp(req), 40, HOUR)) {
      return new Response(JSON.stringify({ error: "You've sent a lot of messages. Please try again in a little while." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
          region: z.string().optional().describe("City or two-letter US state"),
          limit: z.number().min(1).max(5).default(3),
        }),
        execute: async ({ query, category, region, limit }) => {
          let q = supabase
            .from("fundraisers")
            .select("id, unique_slug, title, story, monthly_goal, amount_raised, donors_count, city, state_code, category")
            .eq("status", "active")
            .eq("is_example", false)
            .order("created_at", { ascending: false })
            .limit(limit);
          // Words only: commas, brackets and wildcards would change the filter itself.
          const clean = (text?: string) => (text ?? "").replace(/[^\p{L}\p{N}\s'-]/gu, " ").trim().slice(0, 60);
          const words = clean(query);
          const place = clean(region);
          if (words) q = q.or(`title.ilike.%${words}%,story.ilike.%${words}%`);
          if (category && clean(category)) q = q.ilike("category", `%${clean(category)}%`);
          if (place) q = q.or(`city.ilike.%${place}%,state_code.ilike.%${place}%`);
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
              location: [f.city, f.state_code].filter(Boolean).join(", ") || null,
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
      explainTransparency: tool({
        description: "Explain where a donation goes: 100% of each gift to the family, optional tip, optional card fee.",
        inputSchema: z.object({}),
        execute: async () => ({
          gift: "100% of every gift goes to the family as store coupons and gift cards. No platform fee is taken from it.",
          tip: "Donors can add an optional tip at checkout; tips pay for running CouponDonation.",
          cardFee: "Donors can choose to cover the card processing fee. If they don't, CouponDonation pays it from tips.",
          tracking: "Each donation gets a receipt, and fundraiser pages show totals by store and how much has been used.",
        }),
      }),
    };

    const result = streamText({
      model: gateway("google/gemini-3-flash-preview"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(6),
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
