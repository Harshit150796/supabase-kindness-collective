import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderOtpEmail, EMAIL_SENDER } from "../_shared/email-layout.ts";
import { isEmail, signupBlocked } from "../_shared/email-exists.ts";
import { HOUR, clientIp, overLimit } from "../_shared/rate-limit.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  purpose?: "signup" | "verify";
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });

// Six digits from the cryptographic random generator (Math.random is predictable).
const generateOTP = (): string => String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email: rawEmail, purpose }: SendOTPRequest = await req.json();

    if (!rawEmail || typeof rawEmail !== "string") return json({ error: "Email is required" }, 400);

    // The same address rule as the sign-up form, so a code is never sent for an address the
    // account step would then refuse.
    const email = rawEmail.trim().toLowerCase();
    if (!isEmail(email)) return json({ error: "Invalid email format" }, 400);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // At most 30 codes an hour from one network (a campus or event Wi-Fi shares one address) and 5
    // an hour to one address, so the form can't be used to flood an inbox.
    if (await overLimit(supabase, "otp-send-ip", clientIp(req), 30, HOUR)) {
      return json({ error: "Too many codes requested. Please try again in an hour." }, 429);
    }

    // Signup guard: never send a verification code to an address that already
    // has an account — the caller should route the person to sign in instead. (An unconfirmed
    // account nobody has signed in to doesn't count; create-account replaces it.)
    if (purpose === "signup") {
      const { blocked } = await signupBlocked(supabase, email);
      if (blocked) {
        return json({
          success: false,
          code: "email_exists",
          error: "This email is already registered. Please sign in instead.",
        }, 409);
      }
    }

    // One code a minute per address (the address is lower-cased, so letter case can't get around it).
    const { data: recentOTP } = await supabase
      .from("otp_codes")
      .select("created_at")
      .eq("email", email)
      .gte("created_at", new Date(Date.now() - 60000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOTP) return json({ error: "Please wait 60 seconds before requesting another OTP" }, 429);

    if (await overLimit(supabase, "otp-send-email", email, 5, HOUR)) {
      return json({ error: "Too many codes requested for this email. Please try again in an hour." }, 429);
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Delete any existing OTPs for this email (older rows may hold the address as it was typed)
    await supabase.from("otp_codes").delete().in("email", [...new Set([email, rawEmail.trim()])]);

    // Store OTP in database
    const { error: insertError } = await supabase.from("otp_codes").insert({
      email,
      code: otp,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("Failed to store OTP:", insertError);
      return json({ error: "Failed to generate OTP" }, 500);
    }

    // Send email with OTP using Resend API
    const rendered = renderOtpEmail({ code: otp, expiresInMinutes: 10 });
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_SENDER.from,
        reply_to: EMAIL_SENDER.replyTo,
        to: [email],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json().catch(() => null);
      console.error("Resend API error:", errorData ?? { status: emailResponse.status });
      // The email provider's details stay in the logs.
      return json({ error: "We couldn't send the code. Please check the address and try again." }, 502);
    }

    console.log("OTP email sent");
    return json({ success: true, message: "OTP sent successfully" });
  } catch (error: unknown) {
    console.error("Error in send-otp function:", error);
    return json({ error: "Failed to send OTP" }, 500);
  }
};

serve(handler);
