import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "CouponDonation <verify@coupondonation.com>",
        to: [email],
        subject: "Reset Your CouponDonation Password",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
            <div style="max-width: 460px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #10b981; font-size: 28px; margin: 0 0 8px;">CouponDonation</h1>
                <p style="color: #71717a; font-size: 14px; margin: 0;">Transforming Giving</p>
              </div>
              
              <h2 style="color: #18181b; font-size: 20px; text-align: center; margin-bottom: 16px;">Reset Your Password</h2>
              
              <p style="color: #52525b; font-size: 16px; text-align: center; margin-bottom: 24px;">
                Click the button below to reset your password:
              </p>
              
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #71717a; font-size: 14px; text-align: center; margin-bottom: 0;">
                This link expires in <strong>1 hour</strong>.
              </p>
              <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
                If you didn't request this password reset, you can safely ignore this email.
              </p>
              
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e4e4e7;">
                <p style="color: #a1a1aa; font-size: 11px; text-align: center; margin: 0;">
                  If the button doesn't work, copy and paste this link:<br>
                  <a href="${resetUrl}" style="color: #10b981; word-break: break-all;">${resetUrl}</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
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
