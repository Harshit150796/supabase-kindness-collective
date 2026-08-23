import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderOtpEmail, EMAIL_SENDER } from "../_shared/email-layout.ts";
import { emailExists } from "../_shared/email-exists.ts";



const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  purpose?: "signup" | "verify";
}

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, purpose }: SendOTPRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Signup guard: never send a verification code to an address that already
    // has an account — the caller should route the person to sign in instead.
    if (purpose === "signup") {
      const exists = await emailExists(supabase, email);
      if (exists) {
        return new Response(
          JSON.stringify({
            success: false,
            code: "email_exists",
            error: "This email is already registered. Please sign in instead.",
          }),
          { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Rate limiting: Check if user has requested OTP in the last 60 seconds
    const { data: recentOTP } = await supabase
      .from("otp_codes")
      .select("created_at")
      .eq("email", email)
      .gte("created_at", new Date(Date.now() - 60000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOTP) {
      return new Response(
        JSON.stringify({ error: "Please wait 60 seconds before requesting another OTP" }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Delete any existing OTPs for this email
    await supabase.from("otp_codes").delete().eq("email", email);

    // Store OTP in database
    const { error: insertError } = await supabase.from("otp_codes").insert({
      email,
      code: otp,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("Failed to store OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
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
      let errorData: any = null;
      try {
        errorData = await emailResponse.json();
      } catch {
        // ignore json parse errors
      }

      const message =
        errorData?.message ||
        errorData?.error ||
        `Resend API request failed (status ${emailResponse.status})`;

      console.error("Resend API error:", errorData ?? { status: emailResponse.status, message });

      return new Response(JSON.stringify({ error: message }), {
        status: typeof errorData?.statusCode === "number" ? errorData.statusCode : emailResponse.status || 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const emailData = await emailResponse.json();
    console.log("OTP email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send OTP" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
