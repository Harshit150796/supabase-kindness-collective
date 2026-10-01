import { useCallback, useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { timeAgo } from '@/hooks/useFundraiserLive';

interface Report { id: string; target_type: string; target_id: string; fundraiser_id: string | null; reason: string; details: string | null; status: string; created_at: string }
interface Blocked { id: string; context: string; matched_rules: string[]; masked_excerpt: string | null; status: string; created_at: string; fundraiser_id: string | null }
interface Flagged { id: string; conversation_id: string; body: string; flags: string[]; created_at: string }

export default function AdminModeration() {
  const [reports, setReports] = useState<Report[]>([]);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [flagged, setFlagged] = useState<Flagged[]>([]);
  const load = useCallback(async () => {
    const [r, b, f] = await Promise.all([
      supabase.from('content_reports').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('blocked_attempts').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('messages').select('id,conversation_id,body,flags,created_at').eq('status', 'redacted').order('created_at', { ascending: false }).limit(200),
    ]);
    setReports((r.data ?? []) as Report[]); setBlocked((b.data ?? []) as Blocked[]); setFlagged((f.data ?? []) as Flagged[]);
  }, []);
  useEffect(() => { load(); }, [load]);
  const setReport = async (id: string, status: string) => { await supabase.from('content_reports').update({ status }).eq('id', id); load(); };
  const setAttempt = async (id: string, status: string) => { await supabase.from('blocked_attempts').update({ status }).eq('id', id); load(); };
  const open = reports.filter((r) => r.status === 'open' || r.status === 'reviewing').length;

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pb-16 pt-28">
        <h1 className="font-display text-5xl font-normal">Moderation</h1>
        <p className="mt-2 text-muted-foreground">Reports, blocked payment requests and messages with removed contact details.</p>
        <Tabs defaultValue="reports" className="mt-8">
          <TabsList>
            <TabsTrigger value="reports">Reports ({open})</TabsTrigger>
            <TabsTrigger value="blocked">Blocked ({blocked.filter((b) => b.status !== 'reviewed').length})</TabsTrigger>
            <TabsTrigger value="flagged">Redacted ({flagged.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="reports">
            <table className="mt-4 w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2">When</th><th>Type</th><th>Reason</th><th>Details</th><th>Status</th><th /></tr></thead>
              <tbody>{reports.map((r) => (
                <tr key={r.id} className="border-b border-border align-top">
                  <td className="py-3 pr-3 whitespace-nowrap">{timeAgo(r.created_at)}</td><td className="pr-3">{r.target_type}<div className="text-xs text-muted-foreground">{r.target_id.slice(0, 8)}</div></td>
                  <td className="pr-3">{r.reason}</td><td className="max-w-xs pr-3 text-muted-foreground">{r.details}</td><td className="pr-3">{r.status}</td>
                  <td className="space-x-1 whitespace-nowrap"><Button size="sm" variant="outline" onClick={() => setReport(r.id, 'resolved')}>Resolve</Button><Button size="sm" variant="ghost" onClick={() => setReport(r.id, 'dismissed')}>Dismiss</Button></td>
                </tr>))}
                {!reports.length && <tr><td colSpan={6} className="py-6 text-muted-foreground">No reports.</td></tr>}
              </tbody>
            </table>
          </TabsContent>
          <TabsContent value="blocked">
            <table className="mt-4 w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2">When</th><th>Where</th><th>Rules</th><th>Masked excerpt</th><th>Status</th><th /></tr></thead>
              <tbody>{blocked.map((b) => (
                <tr key={b.id} className="border-b border-border align-top">
                  <td className="py-3 pr-3 whitespace-nowrap">{timeAgo(b.created_at)}</td><td className="pr-3">{b.context}</td><td className="pr-3">{b.matched_rules.join(', ')}</td>
                  <td className="max-w-sm pr-3 text-muted-foreground">{b.masked_excerpt}</td><td className="pr-3">{b.status}</td>
                  <td><Button size="sm" variant="outline" onClick={() => setAttempt(b.id, 'reviewed')}>Mark reviewed</Button></td>
                </tr>))}
                {!blocked.length && <tr><td colSpan={6} className="py-6 text-muted-foreground">No blocked attempts.</td></tr>}
              </tbody>
            </table>
          </TabsContent>
          <TabsContent value="flagged">
            <ul className="mt-4 divide-y divide-border">{flagged.map((m) => (
              <li key={m.id} className="py-3 text-sm"><p className="text-muted-foreground">{timeAgo(m.created_at)} · {m.flags.join(', ')}</p><p className="mt-1">{m.body}</p></li>))}
              {!flagged.length && <li className="py-6 text-muted-foreground">No redacted messages.</li>}
            </ul>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
