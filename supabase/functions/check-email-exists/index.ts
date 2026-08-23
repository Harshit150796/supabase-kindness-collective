import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Case-insensitive existence check against profiles first (fast, indexed-ish),
// then against auth users so accounts without a profile row are still detected.
export async function emailExists(
  supabaseAdmin: ReturnType<typeof createClient>,
  normalizedEmail: string
): Promise<boolean> {
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (profileError) {
    console.error("Error checking email in profiles:", profileError);
  } else if (profileData) {
    return true;
  }

  // Authoritative fallback: scan auth users (paged) for a case-insensitive match.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      console.error("Error listing auth users:", error);
      break;
    }
    const users = data?.users ?? [];
    if (users.some((u: any) => (u.email ?? "").toLowerCase() === normalizedEmail)) {
      return true;
    }
    if (users.length < 200) break;
  }

  return false;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return new Response(
        JSON.stringify({ error: "A valid email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const exists = await emailExists(supabaseAdmin, normalizedEmail);
    console.log(`Email check completed: exists = ${exists}`);

    return new Response(
      JSON.stringify({ exists }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in check-email-exists:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
