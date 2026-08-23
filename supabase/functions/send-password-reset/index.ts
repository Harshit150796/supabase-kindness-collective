import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderPasswordResetEmail, EMAIL_SENDER } from "../_shared/email-layout.ts";


const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendPasswordResetRequest {
  email: string;
}

const generateToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SendPasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: Check if user has requested reset in the last 60 seconds
    const { data: recentRequest } = await supabase
      .from("password_reset_tokens")
      .select("created_at")
      .eq("email", email.toLowerCase())
      .gte("created_at", new Date(Date.now() - 60000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentRequest) {
      // Return success anyway to prevent email enumeration
      return new Response(
        JSON.stringify({ success: true, message: "If this email is registered, you will receive a reset link" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user exists (but don't reveal this to the client)
    const { data: userData } = await supabase.auth.admin.listUsers();
    const userExists = userData?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!userExists) {
      // Return success anyway to prevent email enumeration
      console.log("Password reset requested for non-existent email:", email);
      return new Response(
        JSON.stringify({ success: true, message: "If this email is registered, you will receive a reset link" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing tokens for this email
    await supabase.from("password_reset_tokens").delete().eq("email", email.toLowerCase());

    // Store token
    const { error: insertError } = await supabase.from("password_reset_tokens").insert({
      email: email.toLowerCase(),
      token,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("Failed to store reset token:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate reset link" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build reset URL
    const resetUrl = `https://www.coupondonation.com/reset-password?token=${token}`;

    // Send email via Resend
    const rendered = renderPasswordResetEmail({ resetUrl, expiresInMinutes: 60 });
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
        // ignore
      }
      console.error("Resend API error:", errorData ?? { status: emailResponse.status });
      return new Response(
        JSON.stringify({ error: errorData?.message || "Failed to send reset email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Password reset email sent to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "If this email is registered, you will receive a reset link" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send reset email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
