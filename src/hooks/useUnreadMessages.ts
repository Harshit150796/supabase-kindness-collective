import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/** Conversations with activity newer than the user's read marker. Realtime on messaging tables only. */
export function useUnreadMessages() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const load = useCallback(async () => {
    if (!user) { setCount(0); return; }
    const [{ data: convs }, { data: reads }] = await Promise.all([
      supabase.from('conversations').select('id,last_message_at').limit(200),
      supabase.from('conversation_reads').select('conversation_id,last_read_at').eq('user_id', user.id),
    ]);
    const map = new Map((reads ?? []).map((r) => [r.conversation_id, r.last_read_at]));
    setCount((convs ?? []).filter((c) => { const r = map.get(c.id); return !r || new Date(c.last_message_at) > new Date(r); }).length);
  }, [user]);
  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase.channel(`unread-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_reads', filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    const onRead = () => load();
    window.addEventListener('cd:read', onRead);
    return () => { supabase.removeChannel(ch); window.removeEventListener('cd:read', onRead); };
  }, [user, load]);
  return count;
}
