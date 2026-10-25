import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { HOUR, QUARTER_HOUR, clientIp, overLimit, recentCount, recordEvent } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string;
  code: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });

// How long a verified code stays usable for creating the account (create-account consumes it).
const VERIFIED_WINDOW_MS = 15 * 60 * 1000;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyOTPRequest = await req.json();

    if (!email || !code || typeof email !== "string" || typeof code !== "string") {
      return json({ error: "Email and code are required" }, 400);
    }
    if (!/^\d{6}$/.test(code.trim())) return json({ error: "Invalid or expired OTP code" }, 400);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Guessing limits: 5 wrong codes per email in 15 minutes, 30 tries an hour per network.
    const normalizedEmail = email.trim().toLowerCase();
    if ((await recentCount(supabase, "otp-fail", normalizedEmail, QUARTER_HOUR)) >= 5) {
      return json({ error: "Too many wrong codes. Wait 15 minutes, then request a new code." }, 429);
    }
    if (await overLimit(supabase, "otp-verify-ip", clientIp(req), 30, HOUR)) {
      return json({ error: "Too many attempts. Please try again later." }, 429);
    }

    // Codes are stored lower-cased; older ones may hold the address as it was typed.
    const addresses = [...new Set([normalizedEmail, email.trim()])];

    // One locked database call counts the try and then checks the code, so no code gets more than
    // five guesses, even from requests sent all at once. A verified code stays usable for 15
    // minutes so create-account can open the account.
    const { data: outcome, error: checkError } = await supabase.rpc("otp_check", { _emails: addresses, _code: code.trim() });
    if (!checkError && typeof outcome === "string") {
      if (outcome === "ok") return json({ success: true, verified: true });
      await recordEvent(supabase, "otp-fail", normalizedEmail);
      if (outcome === "locked") return json({ error: "Too many wrong codes. Please request a new code." }, 429);
      return json({ error: "Invalid or expired OTP code" }, 400);
    }

    // Before the database has otp_check: the same check in separate steps.
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_codes")
      .select("id, email")
      .in("email", addresses)
      .eq("code", code.trim())
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching OTP:", fetchError);
      return json({ error: "Failed to verify OTP" }, 500);
    }

    if (!otpRecord) {
      await recordEvent(supabase, "otp-fail", normalizedEmail);
      return json({ error: "Invalid or expired OTP code" }, 400);
    }

    // Mark it verified and keep it for a short while: create-account needs it to open the account
    // (a verified code can't be verified again, and it is deleted once the account exists).
    const { error: updateError } = await supabase
      .from("otp_codes")
      .update({ verified: true, expires_at: new Date(Date.now() + VERIFIED_WINDOW_MS).toISOString() })
      .eq("id", otpRecord.id);

    if (updateError) {
      console.error("Error updating OTP:", updateError);
      return json({ error: "Failed to verify OTP" }, 500);
    }

    // Clean up any other codes for this address
    await supabase.from("otp_codes").delete().in("email", addresses).neq("id", otpRecord.id);

    console.log("OTP verified");
    return json({ success: true, verified: true });
  } catch (error: unknown) {
    console.error("Error in verify-otp function:", error);
    return json({ error: "Failed to verify OTP" }, 500);
  }
};

serve(handler);
