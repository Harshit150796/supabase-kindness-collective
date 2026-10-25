// Retired in the October 2026 security review: Stripe is no longer used (Square handles every
// payment), so this endpoint no longer opens checkouts. The Stripe webhook stays for refunds of
// older Stripe gifts. Delete the function from the backend when convenient.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return new Response(JSON.stringify({ error: "Card payments now go through Square. Please refresh the page and try again." }), {
    status: 410,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
