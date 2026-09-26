const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Returns public (non-secret) identifiers the browser needs to draw on-page payment forms.
Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const env = (Deno.env.get("SQUARE_ENVIRONMENT") || "production").toLowerCase();
  return new Response(JSON.stringify({
    squareApplicationId: (Deno.env.get("SQUARE_APPLICATION_ID") ?? "").trim(),
    squareLocationId: (Deno.env.get("SQUARE_LOCATION_ID") ?? "").trim(),
    squareSandbox: env === "sandbox",
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
