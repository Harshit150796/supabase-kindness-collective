import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1x1 transparent GIF
const PIXEL = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), c => c.charCodeAt(0));

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const c = url.searchParams.get("c"); // campaign_id
    const s = url.searchParams.get("s"); // subscriber_id
    const e = url.searchParams.get("e"); // recipient_email

    if (c && (s || e)) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("email_events").insert({
        campaign_id: c,
        subscriber_id: s || null,
        recipient_email: e || null,
        event_type: "opened",
      });
      if (s) {
        await supabase.from("email_subscribers")
          .update({ last_open_at: new Date().toISOString() })
          .eq("id", s);
      }
    }
  } catch (err) {
    console.error("track-open error:", err);
  }

  return new Response(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    },
  });
});
