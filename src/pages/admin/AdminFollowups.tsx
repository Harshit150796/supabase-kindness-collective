import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { sb, rpc, fmtDate } from '@/lib/adminApi';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

type Persona = { id: string; label: string; persona_key: string; evidence: any; visitor_count: number; signals: any; subject: string | null; body: string | null; approved: boolean; version: number; approved_at: string | null };

function PersonaCard({ p, canEdit, onSaved }: { p: Persona; canEdit: boolean; onSaved: () => void }) {
  const [label, setLabel] = useState(p.label);
  const [subject, setSubject] = useState(p.subject ?? '');
  const [body, setBody] = useState(p.body ?? '');
  const [busy, setBusy] = useState(false);
  const save = async (approved: boolean) => {
    setBusy(true);
    try { await rpc('admin_followup_save_persona', { _id: p.id, _label: label, _subject: subject, _body: body, _approved: approved }); toast({ title: approved ? 'Approved' : 'Saved as draft' }); onSaved(); }
    catch (e) { toast({ title: 'Not saved', description: (e as Error).message, variant: 'destructive' }); } finally { setBusy(false); }
  };
  const signals: string[] = Array.isArray(p.signals) ? p.signals.map((s: any) => (typeof s === 'string' ? s : s?.path)).filter(Boolean) : [];
  return (
    <div className="rounded-lg bg-muted/40 p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} disabled={!canEdit} className="max-w-sm font-medium" aria-label="Visitor type name" />
        <span className="text-sm text-muted-foreground">{p.approved ? `Approved ${fmtDate(p.approved_at)} · v${p.version}` : `Draft · v${p.version}`} · {p.visitor_count} visitors</span>
      </div>
      {signals.length > 0 && <p className="text-sm text-muted-foreground">Pages that signal this type: {signals.join(', ')}</p>}
      {p.evidence && Object.keys(p.evidence).length > 0 && <p className="text-sm text-muted-foreground">Evidence: {typeof p.evidence === 'string' ? p.evidence : p.evidence.summary ?? JSON.stringify(p.evidence)}</p>}
      <Input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!canEdit} placeholder="Email subject" aria-label="Email subject" />
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} disabled={!canEdit} rows={6} placeholder="Email message" aria-label="Email message" />
      <p className="text-xs text-muted-foreground">An unsubscribe link is added to the end of every email automatically. Editing an approved email needs approving again.</p>
      {canEdit && (
        <div className="flex gap-2">
          <Button disabled={busy} onClick={() => save(true)}>Approve</Button>
          <Button variant="outline" disabled={busy} onClick={() => save(false)}>Save as draft</Button>
        </div>
      )}
    </div>
  );
}

export default function AdminFollowups() {
  const { isAdmin, isStaff: canEdit } = useTeamRole();
  const settings = useQuery({ queryKey: ['fu-settings'], queryFn: async () => { const { data, error } = await sb.from('admin_settings').select('followup_live_sending, followup_last_run_at').eq('id', 1).single(); if (error) throw error; return data; } });
  const personas = useQuery({ queryKey: ['fu-personas'], queryFn: async () => { const { data, error } = await sb.from('followup_personas').select('*').order('created_at'); if (error) throw error; return data as Persona[]; } });
  const sends = useQuery({ queryKey: ['fu-sends'], queryFn: async () => { const { data, error } = await sb.from('followup_sends').select('id, status, reason, pages, sent_at, updated_at, persona_version, visitor_consents(email), followup_personas(label)').order('updated_at', { ascending: false }).limit(200); if (error) throw error; return data as any[]; } });
  const optedIn = useQuery({ queryKey: ['fu-optin'], queryFn: async () => { const { count } = await sb.from('visitor_consents').select('id', { count: 'exact', head: true }).eq('consent_status', 'opted_in'); return count ?? 0; } });

  const setLive = async (on: boolean) => {
    try { await rpc('admin_followup_set_live', { _on: on }); toast({ title: on ? 'Live sending on' : 'Live sending off' }); settings.refetch(); }
    catch (e) { toast({ title: 'Not changed', description: (e as Error).message, variant: 'destructive' }); }
  };
  const sent = (sends.data ?? []).filter((s) => s.status === 'sent');
  const skipped = (sends.data ?? []).filter((s) => s.status !== 'sent');
  const Row = (s: any) => (
    <tr key={s.id} className="border-b border-border/60 align-top">
      <td className="py-2 pr-4">{s.visitor_consents?.email}</td>
      <td className="py-2 pr-4">{s.followup_personas?.label}</td>
      <td className="py-2 pr-4">{s.status === 'sent' ? fmtDate(s.sent_at) : s.reason}</td>
      <td className="py-2 text-muted-foreground">{(s.pages ?? []).slice(0, 6).join(', ')}</td>
    </tr>
  );
  const Table = ({ rows, third }: { rows: any[]; third: string }) => rows.length ? (
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 pr-4 font-medium">Email</th><th className="py-2 pr-4 font-medium">Visitor type</th><th className="py-2 pr-4 font-medium">{third}</th><th className="py-2 font-medium">Pages viewed</th></tr></thead><tbody>{rows.map(Row)}</tbody></table></div>
  ) : <p className="text-sm text-muted-foreground">Nothing here yet.</p>;

  return (
    <DashboardLayout>
      <PageHeader title="Follow-ups" description="One helpful email per visitor type, sent only to people who ticked “Email me helpful updates”." />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted/40 p-5">
        <div>
          <p className="font-medium text-foreground">Live sending</p>
          <p className="text-sm text-muted-foreground">{optedIn.data ?? 0} people opted in · last check {fmtDate(settings.data?.followup_last_run_at)} · max one email per person every 14 days{isAdmin ? '' : ' · only admins can switch this'}</p>
        </div>
        <Switch disabled={!isAdmin || !settings.data} checked={!!settings.data?.followup_live_sending} onCheckedChange={setLive} aria-label="Live sending" />
      </div>
      <Tabs defaultValue="types">
        <TabsList><TabsTrigger value="types">Visitor types</TabsTrigger><TabsTrigger value="log">Send log ({sent.length})</TabsTrigger><TabsTrigger value="skipped">Skipped ({skipped.length})</TabsTrigger></TabsList>
        <TabsContent value="types" className="space-y-4 pt-4">
          {personas.data?.length
            ? personas.data.map((p) => <PersonaCard key={`${p.id}:${p.version}`} p={p} canEdit={canEdit} onSaved={() => personas.refetch()} />)
            : <p className="text-sm text-muted-foreground">Not enough visit data yet. After a few weeks of visits, visitor types and email drafts will appear here for approval.</p>}
        </TabsContent>
        <TabsContent value="log" className="pt-4"><Table rows={sent} third="Sent" /></TabsContent>
        <TabsContent value="skipped" className="pt-4"><Table rows={skipped} third="Reason" /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
