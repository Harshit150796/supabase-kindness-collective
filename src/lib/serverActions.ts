import { supabase } from '@/integrations/supabase/client';

/** Invoke an edge function and surface its JSON error message (including 4xx bodies). */
export async function callFn<T = any>(name: string, body: Record<string, unknown>): Promise<{ data?: T; error?: string; blocked?: boolean }> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (!error) return { data: data as T };
  try {
    const ctx = (error as any).context as Response | undefined;
    const j = ctx ? await ctx.json() : null;
    const msg = typeof j?.error === 'string' ? j.error : 'Something went wrong. Please try again.';
    return { error: msg, blocked: !!j?.blocked };
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }
}

export const signInPath = (next: string) => `/auth?next=${encodeURIComponent(next)}`;
