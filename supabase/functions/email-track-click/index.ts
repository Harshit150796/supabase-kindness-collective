import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isSiteUrl, isWebUrl, linkSig } from "../_shared/link-sign.ts";
import { timingSafeEqual, UUID_RE } from "../_shared/auth.ts";

const HOME = "https://www.coupondonation.com";

// Emails sent before links were signed: forward to an outside link only if that campaign's own
// content (written by the team) contains it.
// deno-lint-ignore no-explicit-any
async function inCampaign(supabase: any, campaignId: string, url: string): Promise<boolean> {
  try {
    const { data: campaign } = await supabase.from("email_campaigns")
      .select("html_content, template_id").eq("id", campaignId).maybeSingle();
    let html: string = campaign?.html_content ?? "";
    if (!html.trim() && campaign?.template_id) {
      const { data: tpl } = await supabase.from("email_templates").select("html_content").eq("id", campaign.template_id).maybeSingle();
      html = tpl?.html_content ?? "";
    }
    return html.includes(`"${url}"`);
  } catch {
    return false;
  }
}

// Records a newsletter click, then forwards to the link. It forwards only to a link signed by
// send-newsletter for that campaign, to our own site, or (for older emails, sent unsigned) to a link
// in that campaign's content, so the address can't be used to bounce people to any website.
serve(async (req) => {
  const url = new URL(req.url);
  const c = url.searchParams.get("c") ?? "";
  const s = url.searchParams.get("s");
  const e = url.searchParams.get("e");
  const u = url.searchParams.get("u") ?? "";
  const k = url.searchParams.get("k") ?? "";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let target = HOME;
  if (u && isWebUrl(u)) {
    const signed = k && UUID_RE.test(c) ? timingSafeEqual(k, await linkSig(c, u)) : false;
    if (signed || isSiteUrl(u)) target = u;
    else if (!k && UUID_RE.test(c) && (await inCampaign(supabase, c, u))) target = u;
  }

  try {
    if (UUID_RE.test(c) && (s || e) && (!s || UUID_RE.test(s))) {
      await supabase.from("email_events").insert({
        campaign_id: c,
        subscriber_id: s || null,
        recipient_email: e ? e.slice(0, 320) : null,
        event_type: "clicked",
        url: target,
      });
      if (s) {
        await supabase.from("email_subscribers")
          .update({ last_click_at: new Date().toISOString() })
          .eq("id", s);
      }
    }
  } catch (err) {
    console.error("track-click error:", err);
  }

  return new Response(null, {
    status: 302,
    headers: { Location: target, "Cache-Control": "no-store" },
  });
});
