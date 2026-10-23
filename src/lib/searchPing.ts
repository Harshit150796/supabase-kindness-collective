import { supabase } from '@/integrations/supabase/client';

/**
 * Tells Bing-powered search (Bing, Copilot, DuckDuckGo, ChatGPT search) that a fundraiser page is new
 * or changed, through the indexnow edge function. Fire and forget: it never blocks or fails the caller.
 */
export function pingSearchEngines(slug?: string | null) {
  if (!slug) return;
  try {
    void supabase.functions.invoke('indexnow', { body: { slug } }).catch(() => undefined);
  } catch { /* offline or blocked */ }
}
