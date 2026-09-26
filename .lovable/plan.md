# Provide the Supabase REST API Key

## Goal
The user asked for "the API key for the REST API." Most likely meaning: the Supabase REST API credentials for this project.

## Answer (already given in chat)
- API URL: `https://vbnbacowuoeeojjdrzzp.supabase.co`
- Anon (public) key: already present in the project's `.env` as `VITE_SUPABASE_PUBLISHABLE_KEY` and shared in chat. Safe for browser/public use; RLS protects the data.
- Service role key: stored securely in the project for edge functions; never displayed or shared. User can copy it from Supabase dashboard → Project Settings → API if needed.

## If they meant something else
- Stripe secret key / Square access token: point them to the respective dashboard; never ask them to paste secrets in chat — use the secure secret form instead.

## No code changes required
This is an information request. Nothing to build.
