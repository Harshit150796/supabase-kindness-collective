import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Flag, EyeOff, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { callFn, signInPath } from '@/lib/serverActions';
import { timeAgo } from '@/hooks/useFundraiserLive';
import { ReportDialog } from './ReportDialog';

interface Comment { id: string; user_id: string; display_name: string; body: string; is_hidden: boolean; created_at: string }

export function CommentsSection({ fundraiserId, isTeam, slug }: { fundraiserId: string; isTeam: boolean; slug: string }) {
  const { user } = useAuth(); const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Record<string, string[]>>({});
  const [canPost, setCanPost] = useState(false);
  const [body, setBody] = useState(''); const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [limit, setLimit] = useState(5);

  const load = useCallback(async () => {
    const { data } = await supabase.from('fundraiser_comments').select('id,user_id,display_name,body,is_hidden,created_at').eq('fundraiser_id', fundraiserId).order('created_at', { ascending: false }).limit(100);
    const rows = (data ?? []) as Comment[];
    setComments(rows);
    if (rows.length) {
      const { data: l } = await supabase.from('comment_likes').select('comment_id,user_id').in('comment_id', rows.map((r) => r.id));
      const map: Record<string, string[]> = {};
      (l ?? []).forEach((x) => { (map[x.comment_id] ||= []).push(x.user_id); });
      setLikes(map);
    }
  }, [fundraiserId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!user) { setCanPost(false); return; }
    supabase.rpc('has_completed_donation' as never, { _fid: fundraiserId, _uid: user.id } as never).then(({ data }) => setCanPost(!!data));
  }, [user, fundraiserId]);
  useEffect(() => {
    const ch = supabase.channel(`comments-${fundraiserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fundraiser_comments', filter: `fundraiser_id=eq.${fundraiserId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fundraiserId, load]);

  const post = async () => {
    setBusy(true);
    const r = await callFn('fundraiser-actions', { action: 'comment', fundraiser_id: fundraiserId, body });
    setBusy(false);
    if (r.error) { toast({ title: r.blocked ? 'Not posted' : 'Could not post', description: r.error, variant: 'destructive' }); return; }
    setBody(''); load();
    if (r.data?.redacted) toast({ title: 'Posted', description: 'Contact details were removed for safety.' });
  };
  const toggleLike = async (id: string) => {
    if (!user) return;
    const mine = likes[id]?.includes(user.id);
    if (mine) await supabase.from('comment_likes').delete().eq('comment_id', id).eq('user_id', user.id);
    else await supabase.from('comment_likes').insert({ comment_id: id, user_id: user.id });
    load();
  };
  const toggleHidden = async (c: Comment) => {
    const { error } = await supabase.rpc('set_comment_hidden' as never, { _comment_id: c.id, _hidden: !c.is_hidden } as never);
    if (error) toast({ title: 'Could not change', variant: 'destructive' }); else load();
  };

  return (
    <section>
      <h2 className="font-display text-4xl font-normal text-foreground">Words of support</h2>
      <p className="mt-2 text-muted-foreground">Messages from people who donated to this fundraiser.</p>
      {canPost ? (
        <div className="mt-6 space-y-3">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} placeholder="Leave a few kind words" />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Please don't share payment apps, codes or contact details.</p>
            <Button onClick={post} disabled={busy || !body.trim()}>Post</Button>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          {user ? 'Donate to this fundraiser to leave words of support.' : <><Link to={signInPath(`/f/${slug}`)} className="inline-flex min-h-11 items-center underline underline-offset-4">Sign in</Link> after donating to leave words of support.</>}
        </p>
      )}
      <ul className="mt-8 divide-y divide-border">
        {comments.length === 0 && <li className="py-4 text-muted-foreground">No words of support yet.</li>}
        {comments.slice(0, limit).map((c) => (
          <li key={c.id} className={`py-5 ${c.is_hidden ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">{c.display_name[0]?.toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{c.display_name} <span className="font-normal text-sm text-muted-foreground">· {timeAgo(c.created_at)}{c.is_hidden ? ' · hidden' : ''}</span></p>
                <p className="mt-1 whitespace-pre-line text-muted-foreground">{c.body}</p>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <button onClick={() => toggleLike(c.id)} disabled={!user} className="flex items-center gap-1 disabled:cursor-default" aria-label="Like">
                    <Heart className={`h-4 w-4 ${user && likes[c.id]?.includes(user.id) ? 'fill-primary text-primary' : ''}`} />{likes[c.id]?.length ?? 0}
                  </button>
                  <button onClick={() => setReport(c.id)} className="flex items-center gap-1"><Flag className="h-4 w-4" />Report</button>
                  {isTeam && <button onClick={() => toggleHidden(c)} className="flex items-center gap-1">{c.is_hidden ? <><Eye className="h-4 w-4" />Unhide</> : <><EyeOff className="h-4 w-4" />Hide</>}</button>}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {comments.length > limit && <Button variant="outline" onClick={() => setLimit((l) => l + 10)}>Show more</Button>}
      <ReportDialog open={!!report} onOpenChange={(o) => !o && setReport(null)} targetType="comment" targetId={report ?? ''} fundraiserId={fundraiserId} />
    </section>
  );
}
