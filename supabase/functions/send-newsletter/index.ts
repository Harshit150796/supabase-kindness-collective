import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const DAILY_LIMIT = 100;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_id } = await req.json();
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: campaign, error: campErr } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campErr || !campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (campaign.status === "sending" || campaign.status === "sent") {
      return new Response(JSON.stringify({ error: "Campaign already sent or sending" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subscribers, error: subErr } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("subscribed", true);

    if (subErr || !subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ error: "No active subscribers" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("email_campaigns")
      .update({ status: "sending", total_recipients: subscribers.length })
      .eq("id", campaign_id);

    const baseUrl = "https://www.coupondonation.com";
    let sentCount = 0;
    let failCount = 0;

    for (let i = 0; i < subscribers.length && sentCount < DAILY_LIMIT; i++) {
      const sub = subscribers[i];
      const unsubUrl = `${baseUrl}/unsubscribe?token=${sub.unsubscribe_token}`;

      // Minimal, transactional-style HTML — no heavy styling, no colored buttons
      const htmlEmail = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333333;line-height:1.6;">
<div style="max-width:580px;margin:0 auto;padding:20px;">
<img src="${baseUrl}/favicon.png" alt="CouponDonation" width="32" height="32" style="display:block;margin-bottom:16px;" />
${campaign.html_content}
<p style="margin-top:32px;font-size:11px;color:#999999;">
You're receiving this because you subscribed to CouponDonation updates.<br/>
<a href="${unsubUrl}" style="color:#999999;">Unsubscribe</a>
</p>
</div>
</body>
</html>`;

      // Plain text version for deliverability
      const textContent = campaign.html_content
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim();

      const textEmail = `${textContent}\n\n---\nYou're receiving this because you subscribed to CouponDonation updates.\nUnsubscribe: ${unsubUrl}`;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `Harshit from CouponDonation <${campaign.sender_email}>`,
            to: [sub.email],
            subject: campaign.subject,
            html: htmlEmail,
            text: textEmail,
          }),
        });

        if (res.ok) {
          sentCount++;
        } else {
          failCount++;
          console.error(`Failed to send to ${sub.email}:`, await res.text());
        }
      } catch (e) {
        failCount++;
        console.error(`Error sending to ${sub.email}:`, e);
      }

      if (i < subscribers.length - 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    await supabase
      .from("email_campaigns")
      .update({
        status: failCount > 0 && sentCount === 0 ? "failed" : "sent",
        sent_count: sentCount,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaign_id);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, failed: failCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-newsletter error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
