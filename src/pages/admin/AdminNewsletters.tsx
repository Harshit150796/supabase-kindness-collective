import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { sb, rpc, adminWrite, fmtDate } from '@/lib/adminApi';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Plus, Send, Users, Mail, Trash2, Upload, Eye, Calendar, FileText, Filter, BarChart3, TestTube } from 'lucide-react';

interface Campaign {
  id: string; subject: string; html_content: string; preview_text: string | null;
  sender_email: string; status: string; sent_count: number; total_recipients: number;
  created_at: string; sent_at: string | null;
  template_id?: string | null; scheduled_for?: string | null; audience_type?: string;
  segment_id?: string | null; reply_to?: string | null; tracking_enabled?: boolean;
}
interface Subscriber { id: string; email: string; name: string | null; subscribed: boolean; subscribed_at: string; unsubscribed_at: string | null; source: string; tags?: string[]; last_open_at?: string | null; last_click_at?: string | null; }
interface Template { id: string; name: string; subject: string; preview_text: string | null; html_content: string; created_at: string; }
interface Segment { id: string; name: string; description: string | null; filter_spec: any; last_count: number; }
interface EventRow { id: string; campaign_id: string | null; event_type: string; recipient_email: string | null; url: string | null; created_at: string; }

const DEFAULT_FORM = {
  subject: '', html_content: '', preview_text: '',
  template_id: '', audience_type: 'all', segment_id: '',
  scheduled_for: '', tracking_enabled: true,
};

export default function AdminNewsletters() {
  const { toast } = useToast();
  const { canWrite, isAdmin } = useTeamRole();
  const camp = useAdminPaged<Campaign>({ table: 'email_campaigns', searchCols: ['subject'], defaultSort: { key: 'created_at', dir: 'desc' }, pageSize: 15 });
  const subs = useAdminPaged<Subscriber>({ table: 'email_subscribers', searchCols: ['email', 'name'], defaultSort: { key: 'created_at', dir: 'desc' } });
  const evs = useAdminPaged<EventRow>({ table: 'email_events', select: 'id,campaign_id,event_type,recipient_email,url,created_at', searchCols: ['recipient_email', 'event_type'], defaultSort: { key: 'created_at', dir: 'desc' } });
  const stats = useQuery({ queryKey: ['adm-email-stats'], queryFn: () => rpc<any>('admin_email_stats') });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [showTemplateEdit, setShowTemplateEdit] = useState(false);
  const [showSegmentEdit, setShowSegmentEdit] = useState(false);
  const [sending, setSending] = useState(false);
  const [importing, setImporting] = useState(false);

  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubTags, setNewSubTags] = useState('');
  const [subSearch, setSubSearch] = useState('');

  const [tplForm, setTplForm] = useState({ id: '', name: '', subject: '', preview_text: '', html_content: '' });
  const [segForm, setSegForm] = useState({ id: '', name: '', description: '', tags: '' });

  useEffect(() => { fetchAll(); }, []);

  // Templates and segments are small reference lists (also used by the compose form); capped at 200 each.
  const fetchAll = async () => {
    setLoading(true);
    const [tplRes, segRes] = await Promise.all([
      sb.from('email_templates').select('*').order('created_at', { ascending: false }).range(0, 199),
      sb.from('email_segments').select('*').order('created_at', { ascending: false }).range(0, 199),
    ]);
    setTemplates((tplRes.data as any) || []);
    setSegments((segRes.data as any) || []);
    setLoading(false);
    camp.q.refetch(); subs.q.refetch(); evs.q.refetch(); stats.refetch();
  };
  const W = async (fn: () => Promise<unknown>) => { try { await fn(); return true; } catch (e) { toast({ title: 'Could not save', description: (e as Error).message, variant: 'destructive' }); return false; } };

  // ---------- Campaigns ----------
  const handleSaveCampaign = async (status: 'draft' | 'scheduled' = 'draft') => {
    if (!form.subject.trim() || (!form.html_content.trim() && !form.template_id)) {
      toast({ title: 'Subject and content (or template) required', variant: 'destructive' });
      return;
    }
    if (status === 'scheduled' && !form.scheduled_for) {
      toast({ title: 'Pick a schedule date', variant: 'destructive' }); return;
    }
    const payload: any = {
      subject: form.subject,
      html_content: form.html_content,
      preview_text: form.preview_text || null,
      template_id: form.template_id || null,
      audience_type: form.audience_type,
      segment_id: form.audience_type === 'segment' ? (form.segment_id || null) : null,
      scheduled_for: status === 'scheduled' ? new Date(form.scheduled_for).toISOString() : null,
      tracking_enabled: form.tracking_enabled,
      status,
    };
    if (!(await W(() => editId ? adminWrite('email_campaigns', 'update', [editId], payload) : adminWrite('email_campaigns', 'insert', null, payload)))) return;
    setShowCompose(false); setEditId(null); setForm({ ...DEFAULT_FORM });
    fetchAll();
    toast({ title: status === 'scheduled' ? 'Scheduled' : 'Saved as draft' });
  };

  const handleSend = async (campaignId: string) => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-newsletter', { body: { campaign_id: campaignId } });
      if (error) throw error;
      toast({ title: `Sent ${data.sent}${data.failed > 0 ? ` · ${data.failed} failed` : ''}` });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
    }
    setSending(false);
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) { toast({ title: 'Enter a test email', variant: 'destructive' }); return; }
    if (!form.subject.trim() || (!form.html_content.trim() && !form.template_id)) {
      toast({ title: 'Subject and content required', variant: 'destructive' }); return;
    }
    const row = await adminWrite<any>('email_campaigns', 'insert', null, {
      subject: form.subject, html_content: form.html_content, preview_text: form.preview_text || null,
      template_id: form.template_id || null, audience_type: 'single',
      test_recipients: [testEmail.trim()], status: 'draft', tracking_enabled: false,
    }).catch((e) => { toast({ title: 'Test failed', description: (e as Error).message, variant: 'destructive' }); return null; });
    if (!row) return;
    setSending(true);
    try {
      await supabase.functions.invoke('send-newsletter', { body: { campaign_id: row.id } });
      toast({ title: `Test sent to ${testEmail}` });
    } catch (e: any) { toast({ title: 'Test failed', description: e.message, variant: 'destructive' }); }
    setSending(false);
  };

  const handleDeleteCampaign = async (id: string) => {
    if (await W(() => adminWrite('email_campaigns', 'delete', [id]))) { fetchAll(); toast({ title: 'Deleted' }); }
  };

  // ---------- Subscribers ----------
  const handleAddSubscriber = async () => {
    if (!newSubEmail.trim()) return;
    const tags = newSubTags.split(',').map(t => t.trim()).filter(Boolean);
    const ok = await W(() => adminWrite('email_subscribers', 'insert', null, {
      email: newSubEmail.trim().toLowerCase(),
      name: newSubName.trim() || null,
      tags: tags.length ? tags : null,
      source: 'manual',
    }));
    if (ok) {
      setNewSubEmail(''); setNewSubName(''); setNewSubTags(''); setShowAddSub(false);
      fetchAll(); toast({ title: 'Subscriber added' });
    }
  };

  const handleRemoveSubscriber = async (id: string) => {
    if (await W(() => adminWrite('email_subscribers', 'delete', [id]))) { fetchAll(); toast({ title: 'Removed' }); }
  };

  const handleImportUsers = async () => {
    setImporting(true);
    try {
      const imported = await rpc<number>('admin_import_profile_subscribers');
      fetchAll(); toast({ title: `Imported ${imported} new subscribers` });
    } catch (e) { toast({ title: 'Import failed', description: (e as Error).message, variant: 'destructive' }); }
    setImporting(false);
  };

  // ---------- Templates ----------
  const saveTemplate = async () => {
    if (!tplForm.name.trim() || !tplForm.subject.trim()) {
      toast({ title: 'Name and subject required', variant: 'destructive' }); return;
    }
    const payload = { name: tplForm.name, subject: tplForm.subject, preview_text: tplForm.preview_text || null, html_content: tplForm.html_content };
    if (!(await W(() => tplForm.id ? adminWrite('email_templates', 'update', [tplForm.id], payload) : adminWrite('email_templates', 'insert', null, payload)))) return;
    setShowTemplateEdit(false); setTplForm({ id: '', name: '', subject: '', preview_text: '', html_content: '' });
    fetchAll(); toast({ title: 'Template saved' });
  };
  const deleteTemplate = async (id: string) => {
    if (!(await W(() => adminWrite('email_templates', 'delete', [id])))) return;
    fetchAll(); toast({ title: 'Template deleted' });
  };

  // ---------- Segments ----------
  const saveSegment = async () => {
    if (!segForm.name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    const tags = segForm.tags.split(',').map(t => t.trim()).filter(Boolean);
    const payload = { name: segForm.name, description: segForm.description || null, filter_spec: { tags } };
    if (!(await W(() => segForm.id ? adminWrite('email_segments', 'update', [segForm.id], payload) : adminWrite('email_segments', 'insert', null, payload)))) return;
    setShowSegmentEdit(false); setSegForm({ id: '', name: '', description: '', tags: '' });
    fetchAll(); toast({ title: 'Segment saved' });
  };
  const deleteSegment = async (id: string) => {
    if (!(await W(() => adminWrite('email_segments', 'delete', [id])))) return;
    fetchAll(); toast({ title: 'Segment deleted' });
  };

  // ---------- Derived ----------
  const st = stats.data;
  const activeCount = st?.active_subscribers ?? 0;
  const totalSent = st?.sent ?? 0, totalOpens = st?.opened ?? 0, totalClicks = st?.clicked ?? 0;
  const openRate = totalSent ? Math.round((totalOpens / totalSent) * 100) : 0;
  const clickRate = totalSent ? Math.round((totalClicks / totalSent) * 100) : 0;
  const campaigns = camp.rows ?? [];

  const statusBadge = (status: string) => {
    const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline', scheduled: 'secondary', sending: 'secondary', sent: 'default', failed: 'destructive',
    };
    return <Badge variant={map[status] || 'outline'}>{status}</Badge>;
  };

  const campaignStats = (cid: string) => st?.per_campaign?.[cid] ?? { sent: 0, opens: 0, clicks: 0 };

  const subCols: Column<Subscriber>[] = [
    { key: 'email', header: 'Email', sortable: true, cell: (x) => <div><p className="font-medium text-foreground">{x.email}</p><p className="text-xs text-muted-foreground">{x.name || '—'}{x.tags?.length ? ` · ${x.tags.join(', ')}` : ''}</p></div> },
    { key: 'source', header: 'Source', sortable: true, cell: (x) => x.source },
    { key: 'subscribed_at', header: 'Added', sortable: true, cell: (x) => x.source === 'excel_import' ? `Imported · ${fmtDate(x.subscribed_at)}` : fmtDate(x.subscribed_at) },
    { key: 'last_open_at', header: 'Last open', sortable: true, cell: (x) => fmtDate(x.last_open_at) },
    { key: 'subscribed', header: 'Status', sortable: true, cell: (x) => <StatusBadge value={x.subscribed ? 'active' : 'dismissed'} /> },
    ...(isAdmin ? [{ key: 'a', header: '', align: 'right' as const, cell: (x: Subscriber) => <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRemoveSubscriber(x.id)} aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></Button> }] : []),
  ];
  const evCols: Column<EventRow>[] = [
    { key: 'created_at', header: 'Time', sortable: true, cell: (e) => fmtDate(e.created_at) },
    { key: 'event_type', header: 'Event', sortable: true, cell: (e) => <span className="capitalize">{e.event_type}</span> },
    { key: 'recipient_email', header: 'Recipient', cell: (e) => e.recipient_email || '—' },
    { key: 'url', header: 'Link', cell: (e) => <span className="line-clamp-1 max-w-[280px] text-xs">{e.url || '—'}</span> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Newsletters" description="Compose, schedule and track promotional campaigns. Only admins can send." />

        <div className="grid sm:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><Users className="w-7 h-7 text-primary" /><div><p className="text-xl font-bold">{activeCount}</p><p className="text-xs text-muted-foreground">Active subscribers</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Mail className="w-7 h-7 text-primary" /><div><p className="text-xl font-bold">{st?.campaigns ?? '—'}</p><p className="text-xs text-muted-foreground">Campaigns</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Eye className="w-7 h-7 text-primary" /><div><p className="text-xl font-bold">{openRate}%</p><p className="text-xs text-muted-foreground">Avg open rate</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><BarChart3 className="w-7 h-7 text-primary" /><div><p className="text-xl font-bold">{clickRate}%</p><p className="text-xs text-muted-foreground">Avg click rate</p></div></CardContent></Card>
        </div>

        <Tabs defaultValue="campaigns">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers ({st?.subscribers ?? '—'})</TabsTrigger>
            <TabsTrigger value="segments">Segments ({segments.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Campaigns */}
          <TabsContent value="campaigns" className="space-y-4">
            <Button onClick={() => { setEditId(null); setForm({ ...DEFAULT_FORM }); setShowCompose(true); }}>
              <Plus className="w-4 h-4 mr-2" /> New Campaign
            </Button>
            {camp.q.error ? <Card><CardContent className="p-8 text-center text-sm">Couldn't load campaigns. <Button size="sm" variant="outline" onClick={() => camp.q.refetch()}>Try again</Button></CardContent></Card> : camp.q.isLoading ? <p className="text-muted-foreground">Loading…</p> : campaigns.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No campaigns yet.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {campaigns.map(c => {
                  const s = campaignStats(c.id);
                  return (
                    <Card key={c.id}>
                      <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                        <div className="space-y-1 flex-1 min-w-[260px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground">{c.subject}</p>
                            {statusBadge(c.status)}
                            {c.audience_type === 'segment' && <Badge variant="outline">segment</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(c.created_at), 'MMM d, yyyy')}
                            {c.scheduled_for && ` · scheduled ${format(new Date(c.scheduled_for), 'MMM d HH:mm')}`}
                            {c.sent_at && ` · sent ${format(new Date(c.sent_at), 'MMM d HH:mm')}`}
                          </p>
                          {(c.status === 'sent' || c.status === 'sending') && (
                            <p className="text-xs text-muted-foreground">
                              {s.sent} delivered · {s.opens} opens ({s.sent ? Math.round(s.opens / s.sent * 100) : 0}%) · {s.clicks} clicks
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setForm({ ...DEFAULT_FORM, subject: c.subject, html_content: c.html_content, preview_text: c.preview_text || '' }); setShowPreview(true); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(c.status === 'draft' || c.status === 'scheduled') && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditId(c.id);
                                setForm({
                                  subject: c.subject, html_content: c.html_content, preview_text: c.preview_text || '',
                                  template_id: c.template_id || '', audience_type: c.audience_type || 'all',
                                  segment_id: c.segment_id || '',
                                  scheduled_for: c.scheduled_for ? new Date(c.scheduled_for).toISOString().slice(0, 16) : '',
                                  tracking_enabled: c.tracking_enabled !== false,
                                });
                                setShowCompose(true);
                              }}>Edit</Button>
                              {isAdmin && <Button size="sm" onClick={() => handleSend(c.id)} disabled={sending || activeCount === 0}>
                                <Send className="w-4 h-4 mr-1" /> Send now
                              </Button>}
                              {isAdmin && <Button size="sm" variant="destructive" onClick={() => handleDeleteCampaign(c.id)}><Trash2 className="w-4 h-4" /></Button>}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                  <span>{camp.total} campaigns · page {camp.page + 1} of {Math.max(1, Math.ceil(camp.total / camp.pageSize))}</span>
                  <Button size="sm" variant="outline" disabled={camp.page === 0} onClick={() => camp.setPage(camp.page - 1)}>Previous</Button>
                  <Button size="sm" variant="outline" disabled={(camp.page + 1) * camp.pageSize >= camp.total} onClick={() => camp.setPage(camp.page + 1)}>Next</Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates" className="space-y-4">
            <Button onClick={() => { setTplForm({ id: '', name: '', subject: '', preview_text: '', html_content: '' }); setShowTemplateEdit(true); }}>
              <Plus className="w-4 h-4 mr-2" /> New Template
            </Button>
            {templates.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No templates yet. Templates let you reuse layouts across campaigns.</CardContent></Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {templates.map(t => (
                  <Card key={t.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" />{t.name}</p>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => { setTplForm({ id: t.id, name: t.name, subject: t.subject, preview_text: t.preview_text || '', html_content: t.html_content }); setShowTemplateEdit(true); }}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteTemplate(t.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{t.subject}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Subscribers */}
          <TabsContent value="subscribers" className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setShowAddSub(true)}><Plus className="w-4 h-4 mr-2" /> Add</Button>
              <Button variant="outline" onClick={handleImportUsers} disabled={importing}><Upload className="w-4 h-4 mr-2" /> {importing ? 'Importing…' : 'Import from Users'}</Button>
              <Input placeholder="Search email or name…" value={subs.search} onChange={e => subs.setSearch(e.target.value)} className="max-w-xs" />
            </div>
            <DataTable columns={subCols} {...subs.tableProps} rowKey={(r: any) => r.id} empty="No subscribers." />
          </TabsContent>

          {/* Segments */}
          <TabsContent value="segments" className="space-y-4">
            <Button onClick={() => { setSegForm({ id: '', name: '', description: '', tags: '' }); setShowSegmentEdit(true); }}>
              <Plus className="w-4 h-4 mr-2" /> New Segment
            </Button>
            {segments.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No segments. Tag subscribers, then build a segment that targets those tags.</CardContent></Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {segments.map(seg => (
                  <Card key={seg.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold flex items-center gap-2"><Filter className="w-4 h-4" />{seg.name}</p>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => { setSegForm({ id: seg.id, name: seg.name, description: seg.description || '', tags: (seg.filter_spec?.tags || []).join(', ') }); setShowSegmentEdit(true); }}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteSegment(seg.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      {seg.description && <p className="text-sm text-muted-foreground">{seg.description}</p>}
                      <p className="text-xs text-muted-foreground">Tags: {(seg.filter_spec?.tags || []).join(', ') || '—'}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total sent</p><p className="text-2xl font-bold">{totalSent}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Opens</p><p className="text-2xl font-bold">{totalOpens} <span className="text-sm font-normal text-muted-foreground">({openRate}%)</span></p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Clicks</p><p className="text-2xl font-bold">{totalClicks} <span className="text-sm font-normal text-muted-foreground">({clickRate}%)</span></p></CardContent></Card>
            </div>
            <Card>
              <CardContent className="p-4">
                <p className="font-semibold mb-3">Recent activity</p>
                <DataTable columns={evCols} {...evs.tableProps} rowKey={(r: any) => r.id} empty="No events yet." />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Compose */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Campaign' : 'New Campaign'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Template (optional)</label>
                <Select value={form.template_id || 'none'} onValueChange={v => {
                  const tpl = templates.find(t => t.id === v);
                  setForm({
                    ...form,
                    template_id: v === 'none' ? '' : v,
                    subject: tpl && !form.subject ? tpl.subject : form.subject,
                    html_content: tpl && !form.html_content ? tpl.html_content : form.html_content,
                  });
                }}>
                  <SelectTrigger><SelectValue placeholder="Custom HTML" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Custom HTML</SelectItem>
                    {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Audience</label>
                <Select value={form.audience_type} onValueChange={v => setForm({ ...form, audience_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All active subscribers ({activeCount})</SelectItem>
                    <SelectItem value="segment">Segment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.audience_type === 'segment' && (
              <div>
                <label className="text-sm font-medium">Segment</label>
                <Select value={form.segment_id} onValueChange={v => setForm({ ...form, segment_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a segment" /></SelectTrigger>
                  <SelectContent>{segments.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Subject *</label>
              <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Preview text</label>
              <Input value={form.preview_text} onChange={e => setForm({ ...form, preview_text: e.target.value })} />
            </div>
            <p className="text-sm text-muted-foreground">Sent from CouponDonation News &lt;news@coupondonation.com&gt; · Replies go to connect@coupondonation.com</p>
            <div>
              <label className="text-sm font-medium">HTML content {form.template_id && <span className="text-muted-foreground">(overrides template if set)</span>}</label>
              <Textarea value={form.html_content} onChange={e => setForm({ ...form, html_content: e.target.value })} rows={12} className="font-mono text-xs" placeholder="<h1>Hello {{first_name}}!</h1>..." />
              <p className="text-xs text-muted-foreground mt-1">Tokens: {`{{name}} {{first_name}} {{email}}`}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Schedule (optional)</label>
              <Input type="datetime-local" value={form.scheduled_for} onChange={e => setForm({ ...form, scheduled_for: e.target.value })} />
            </div>
            <div className="border-t pt-3 space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><TestTube className="w-4 h-4" />Send test</label>
              <div className="flex gap-2">
                <Input placeholder="test@email.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
                <Button variant="outline" onClick={handleSendTest} disabled={sending}>Send test</Button>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
              <Button variant="outline" onClick={() => handleSaveCampaign('draft')}>Save draft</Button>
              <Button onClick={() => handleSaveCampaign('scheduled')} disabled={!form.scheduled_for}>
                <Calendar className="w-4 h-4 mr-1" /> Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Preview: {form.subject}</DialogTitle></DialogHeader>
          <div className="border rounded-lg p-4 bg-white"><div dangerouslySetInnerHTML={{ __html: form.html_content }} /></div>
        </DialogContent>
      </Dialog>

      {/* Add subscriber */}
      <Dialog open={showAddSub} onOpenChange={setShowAddSub}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Subscriber</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Email *" value={newSubEmail} onChange={e => setNewSubEmail(e.target.value)} />
            <Input placeholder="Name (optional)" value={newSubName} onChange={e => setNewSubName(e.target.value)} />
            <Input placeholder="Tags (comma-separated, e.g. donor, vip)" value={newSubTags} onChange={e => setNewSubTags(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddSub(false)}>Cancel</Button>
              <Button onClick={handleAddSubscriber}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template editor */}
      <Dialog open={showTemplateEdit} onOpenChange={setShowTemplateEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{tplForm.id ? 'Edit Template' : 'New Template'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Template name *" value={tplForm.name} onChange={e => setTplForm({ ...tplForm, name: e.target.value })} />
            <Input placeholder="Default subject *" value={tplForm.subject} onChange={e => setTplForm({ ...tplForm, subject: e.target.value })} />
            <Input placeholder="Preview text" value={tplForm.preview_text} onChange={e => setTplForm({ ...tplForm, preview_text: e.target.value })} />
            <Textarea placeholder="HTML content" rows={14} className="font-mono text-xs" value={tplForm.html_content} onChange={e => setTplForm({ ...tplForm, html_content: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowTemplateEdit(false)}>Cancel</Button>
              <Button onClick={saveTemplate}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Segment editor */}
      <Dialog open={showSegmentEdit} onOpenChange={setShowSegmentEdit}>
        <DialogContent>
          <DialogHeader><DialogTitle>{segForm.id ? 'Edit Segment' : 'New Segment'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Segment name *" value={segForm.name} onChange={e => setSegForm({ ...segForm, name: e.target.value })} />
            <Input placeholder="Description" value={segForm.description} onChange={e => setSegForm({ ...segForm, description: e.target.value })} />
            <Input placeholder="Match subscribers with these tags (comma-separated)" value={segForm.tags} onChange={e => setSegForm({ ...segForm, tags: e.target.value })} />
            <p className="text-xs text-muted-foreground">A subscriber is included if they have any of these tags.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSegmentEdit(false)}>Cancel</Button>
              <Button onClick={saveSegment}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
