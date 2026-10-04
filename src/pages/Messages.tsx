import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Flag, Ban, Send } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { callFn, signInPath } from '@/lib/serverActions';
import { timeAgo } from '@/hooks/useFundraiserLive';
import { ReportDialog } from '@/components/fundraiser/campaign/ReportDialog';
import { SEO } from '@/components/SEO';

interface Conv { id: string; fundraiser_id: string; supporter_id: string; status: string; last_message_at: string; fundraisers: { title: string; unique_slug: string | null } | null }
interface Msg { id: string; sender_id: string; body: string; flags: string[]; status: string; created_at: string; ref_label?: string | null }

export default function Messages() {
  const { user, loading } = useAuth(); const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const active = params.get('c');
  const [convs, setConvs] = useState<Conv[]>([]);
  const [reads, setReads] = useState<Record<string, string>>({});
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [body, setBody] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(async () => {
    if (!user) return;
    const [{ data }, { data: r }] = await Promise.all([
      supabase.from('conversations').select('id,fundraiser_id,supporter_id,status,last_message_at,fundraisers(title,unique_slug)').order('last_message_at', { ascending: false }).limit(200),
      supabase.from('conversation_reads').select('conversation_id,last_read_at').eq('user_id', user.id),
    ]);
    setConvs((data ?? []) as unknown as Conv[]);
    setReads(Object.fromEntries((r ?? []).map((x) => [x.conversation_id, x.last_read_at])));
  }, [user]);

  const markRead = useCallback(async (cid: string) => {
    if (!user) return;
    await supabase.from('conversation_reads').upsert({ conversation_id: cid, user_id: user.id, last_read_at: new Date().toISOString() });
    window.dispatchEvent(new Event('cd:read'));
  }, [user]);

  const loadMsgs = useCallback(async (cid: string) => {
    const { data } = await supabase.from('messages').select('id,sender_id,body,flags,status,created_at,ref_label').eq('conversation_id', cid).order('created_at').limit(500);
    setMsgs((data ?? []) as Msg[]);
    markRead(cid);
  }, [markRead]);

  useEffect(() => { loadConvs(); }, [loadConvs]);
  useEffect(() => { if (active) loadMsgs(active); else setMsgs([]); }, [active, loadMsgs]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`inbox-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => {
        const m = p.new as Msg & { conversation_id: string };
        if (m.conversation_id === active) { setMsgs((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]); markRead(m.conversation_id); }
        loadConvs();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, loadConvs)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, active, loadConvs, markRead]);

  if (loading) return null;
  if (!user) return <Navigate to={signInPath('/messages')} replace />;

  const conv = convs.find((c) => c.id === active);
  const iAmSupporter = conv?.supporter_id === user.id;

  const send = async () => {
    if (!active) return;
    setBusy(true); setErr(null);
    const r = await callFn<{ message: Msg; redacted: boolean }>('send-message', { conversation_id: active, body });
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    setBody('');
    setMsgs((prev) => prev.some((x) => x.id === r.data!.message.id) ? prev : [...prev, r.data!.message]);
    if (r.data?.redacted) toast({ title: 'Sent', description: 'Contact details were removed for safety.' });
    loadConvs();
  };
  const toggleBlock = async () => {
    if (!conv) return;
    const r = await callFn('fundraiser-actions', { action: 'block', conversation_id: conv.id, blocked: conv.status !== 'blocked' });
    if (r.error) toast({ title: 'Could not change', description: r.error, variant: 'destructive' }); else loadConvs();
  };

  return (
    <div className="min-h-dvh bg-background">
      <SEO title="Messages" description="Your CouponDonation conversations." path="/messages" noindex />
      <Navbar />
      <main className="container mx-auto px-4 pb-10 pt-24 md:pt-28">
        <h1 className="font-display text-5xl font-normal text-foreground">Messages</h1>
        <div className="mt-8 grid min-h-[60dvh] gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
          <ul className={`space-y-1 ${active ? 'hidden md:block' : ''}`}>
            {convs.length === 0 && <li className="rounded-[1rem] bg-secondary/60 p-5 text-muted-foreground">No conversations yet. You can message an organizer from any fundraiser page.</li>}
            {convs.map((c) => {
              const unread = !reads[c.id] || new Date(c.last_message_at) > new Date(reads[c.id]);
              return (
                <li key={c.id}>
                  <button onClick={() => setParams({ c: c.id })} className={`w-full rounded-[1rem] p-4 text-left transition-colors ${c.id === active ? 'bg-ink text-ink-foreground' : 'hover:bg-secondary'}`}>
                    <p className="flex items-center gap-2 truncate font-medium">{unread && c.id !== active && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}{c.fundraisers?.title ?? 'Fundraiser'}</p>
                    <p className="text-sm opacity-70">{c.supporter_id === user.id ? 'You → organizer' : 'Supporter'} · {timeAgo(c.last_message_at)}{c.status === 'blocked' ? ' · closed' : ''}</p>
                  </button>
                </li>
              );
            })}
          </ul>

          {conv ? (
            <section className="flex min-h-0 flex-col rounded-[1.5rem] bg-card p-4 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="min-w-0">
                  <button className="mb-1 flex items-center gap-1 text-sm text-muted-foreground md:hidden" onClick={() => setParams({})}><ChevronLeft className="h-4 w-4" />All</button>
                  {conv.fundraisers?.unique_slug ? <Link to={`/f/${conv.fundraisers.unique_slug}`} className="font-medium underline-offset-4 hover:underline">{conv.fundraisers.title}</Link> : <span className="font-medium">Fundraiser</span>}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setReport(true)}><Flag className="mr-1 h-4 w-4" />Report</Button>
                  {!iAmSupporter && <Button size="sm" variant="ghost" onClick={toggleBlock}><Ban className="mr-1 h-4 w-4" />{conv.status === 'blocked' ? 'Unblock' : 'Block'}</Button>}
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-4" style={{ maxHeight: '55dvh' }}>
                {msgs.map((m) => {
                  const mine = m.sender_id === user.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-[1.25rem] px-4 py-2.5 ${mine ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                        {m.ref_label && <p className="mb-1 text-xs font-medium opacity-80">Re: {m.ref_label}</p>}
                        <p className="whitespace-pre-line break-words">{m.body}</p>
                        <p className="mt-1 text-xs opacity-70">{timeAgo(m.created_at)}{m.status === 'redacted' ? ' · contact details removed' : ''}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              {conv.status === 'blocked' ? (
                <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">This conversation has been closed.</p>
              ) : (
                <div className="space-y-2 border-t border-border pt-3">
                  {err && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}
                  <div className="flex gap-2">
                    <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={2} placeholder="Write a message" className="min-h-0" />
                    <Button onClick={send} disabled={busy || !body.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
                  </div>
                  <p className="text-xs text-muted-foreground">All support goes through CouponDonation. Payment apps, codes and bank details are blocked.</p>
                </div>
              )}
              <ReportDialog open={report} onOpenChange={setReport} targetType="conversation" targetId={conv.id} fundraiserId={conv.fundraiser_id} />
            </section>
          ) : (
            <div className="hidden items-center justify-center rounded-[1.5rem] bg-secondary/40 text-muted-foreground md:flex">Select a conversation</div>
          )}
        </div>
      </main>
    </div>
  );
}
