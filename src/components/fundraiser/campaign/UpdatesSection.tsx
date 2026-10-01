import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { timeAgo } from '@/hooks/useFundraiserLive';

interface Update { id: string; title: string; body: string; image_url: string | null; created_at: string }

export function useFundraiserUpdates(fid: string | undefined, refreshKey = 0) {
  const [rows, setRows] = useState<Update[]>([]);
  useEffect(() => {
    if (!fid) return;
    supabase.from('fundraiser_updates').select('id,title,body,image_url,created_at').eq('fundraiser_id', fid).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setRows((data ?? []) as Update[]));
  }, [fid, refreshKey]);
  return rows;
}

export function UpdatesSection({ fundraiserId }: { fundraiserId: string }) {
  const updates = useFundraiserUpdates(fundraiserId);
  if (!updates.length) return null;
  return (
    <section>
      <h2 className="font-display text-4xl font-normal text-foreground">Updates <span className="text-muted-foreground">({updates.length})</span></h2>
      <ol className="mt-6 space-y-8 border-l border-border pl-6">
        {updates.map((u) => (
          <li key={u.id} className="relative">
            <span className="absolute -left-[1.85rem] top-1.5 h-3 w-3 rounded-full bg-primary" />
            <p className="text-sm text-muted-foreground">{timeAgo(u.created_at)}</p>
            <h3 className="mt-1 text-xl font-medium text-foreground">{u.title}</h3>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">{u.body}</p>
            {u.image_url && <img src={u.image_url} alt="" loading="lazy" className="mt-4 max-h-96 w-full rounded-[1rem] object-contain bg-muted/30" />}
          </li>
        ))}
      </ol>
    </section>
  );
}
