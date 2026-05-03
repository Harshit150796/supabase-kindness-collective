import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const FN_BASE = `${SUPABASE_URL}/functions/v1`;
const SITE_URL = "https://www.coupondonation.com";
const DAILY_LIMIT = 100;

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function applyTokens(html: string, sub: any) {
  const name = sub.name || sub.email.split("@")[0];
  const first = name.split(" ")[0];
  return html
    .replaceAll("{{name}}", escapeHtml(name))
    .replaceAll("{{first_name}}", escapeHtml(first))
    .replaceAll("{{email}}", escapeHtml(sub.email));
}

function rewriteLinks(html: string, campaignId: string, sub: any) {
  const sParam = sub.id ? `&s=${sub.id}` : "";
  const eParam = `&e=${encodeURIComponent(sub.email)}`;
  // Don't rewrite unsubscribe / mailto / tracking links
  return html.replace(/<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi, (m, pre, href, post) => {
    if (/^mailto:/i.test(href) || href.includes("/email-track-") || href.includes("/unsubscribe")) return m;
    const tracked = `${FN_BASE}/email-track-click?c=${campaignId}${sParam}${eParam}&u=${encodeURIComponent(href)}`;
    return `<a ${pre}href="${tracked}"${post}>`;
  });
}

function injectPixel(html: string, campaignId: string, sub: any) {
  const sParam = sub.id ? `&s=${sub.id}` : "";
  const eParam = `&e=${encodeURIComponent(sub.email)}`;
  const pixel = `<img src="${FN_BASE}/email-track-open?c=${campaignId}${sParam}${eParam}" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px;" />`;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${pixel}</body>`);
  return html + pixel;
}

async function resolveAudience(supabase: any, campaign: any): Promise<any[]> {
  // Test send
  if (campaign.audience_type === "single" && campaign.test_recipients?.length) {
    return campaign.test_recipients.map((email: string) => ({ email, name: null, id: null, unsubscribe_token: null }));
  }
  // Segment (filter_spec.tags = string[])
  if (campaign.audience_type === "segment" && campaign.segment_id) {
    const { data: seg } = await supabase.from("email_segments").select("filter_spec").eq("id", campaign.segment_id).single();
    let q = supabase.from("email_subscribers").select("*").eq("subscribed", true);
    const tags = seg?.filter_spec?.tags as string[] | undefined;
    if (tags && tags.length) q = q.overlaps("tags", tags);
    const { data } = await q;
    return data || [];
  }
  const { data } = await supabase.from("email_subscribers").select("*").eq("subscribed", true);
  return data || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { campaign_id } = await req.json();
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: campaign, error: campErr } = await supabase
      .from("email_campaigns").select("*").eq("id", campaign_id).single();

    if (campErr || !campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (["sending", "sent"].includes(campaign.status)) {
      return new Response(JSON.stringify({ error: "Already sent or sending" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If template_id is set, hydrate content from the template (allow campaign overrides)
    let subject = campaign.subject;
    let htmlBase = campaign.html_content;
    if (campaign.template_id) {
      const { data: tpl } = await supabase.from("email_templates").select("*").eq("id", campaign.template_id).single();
      if (tpl) {
        if (!subject || subject.trim() === "") subject = tpl.subject;
        if (!htmlBase || htmlBase.trim() === "") htmlBase = tpl.html_content;
      }
    }

    const recipients = await resolveAudience(supabase, campaign);
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("email_campaigns")
      .update({ status: "sending", total_recipients: recipients.length })
      .eq("id", campaign_id);

    const tracking = campaign.tracking_enabled !== false && campaign.audience_type !== "single";
    let sentCount = 0, failCount = 0;

    for (let i = 0; i < recipients.length && sentCount < DAILY_LIMIT; i++) {
      const sub = recipients[i];
      const unsubUrl = sub.unsubscribe_token
        ? `${SITE_URL}/unsubscribe?token=${sub.unsubscribe_token}`
        : `${SITE_URL}/unsubscribe`;

      let body = applyTokens(htmlBase, sub);
      if (tracking) body = rewriteLinks(body, campaign_id, sub);

      const fullHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333;line-height:1.6;">
<div style="max-width:580px;margin:0 auto;padding:20px;">
<a href="${SITE_URL}" style="text-decoration:none;"><img src="${SITE_URL}/favicon.png" alt="CouponDonation" width="32" height="32" style="display:block;margin-bottom:16px;" /></a>
${body}
<p style="margin-top:32px;font-size:11px;color:#999;">
You're receiving this because you subscribed to CouponDonation updates.<br/>
<a href="${unsubUrl}" style="color:#999;">Unsubscribe</a>
</p>
</div>${tracking ? injectPixel("", campaign_id, sub) : ""}
</body></html>`;

      const text = body.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim() + `\n\n---\nUnsubscribe: ${unsubUrl}`;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: `CouponDonation <${campaign.sender_email}>`,
            to: [sub.email],
            subject,
            html: fullHtml,
            text,
            reply_to: campaign.reply_to || undefined,
            headers: sub.unsubscribe_token ? {
              "List-Unsubscribe": `<${unsubUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            } : undefined,
          }),
        });
        if (res.ok) {
          sentCount++;
          if (campaign.audience_type !== "single") {
            await supabase.from("email_events").insert({
              campaign_id, subscriber_id: sub.id || null, recipient_email: sub.email, event_type: "sent",
            });
          }
        } else {
          failCount++;
          console.error(`send fail ${sub.email}:`, await res.text());
        }
      } catch (e) {
        failCount++;
        console.error(`send error ${sub.email}:`, e);
      }

      if (i < recipients.length - 1) await new Promise(r => setTimeout(r, 200));
    }

    await supabase.from("email_campaigns").update({
      status: campaign.audience_type === "single" ? "draft" : (failCount > 0 && sentCount === 0 ? "failed" : "sent"),
      sent_count: sentCount,
      sent_at: new Date().toISOString(),
    }).eq("id", campaign_id);

    return new Response(JSON.stringify({ success: true, sent: sentCount, failed: failCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-newsletter error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
