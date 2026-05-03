import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  sender_email: 'updates@coupondonation.com',
  reply_to: 'connect@coupondonation.com',
  template_id: '', audience_type: 'all', segment_id: '',
  scheduled_for: '', tracking_enabled: true,
};

export default function AdminNewsletters() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
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

  const fetchAll = async () => {
    setLoading(true);
    const [campRes, subRes, tplRes, segRes, evRes] = await Promise.all([
      supabase.from('email_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('email_subscribers').select('*').order('created_at', { ascending: false }),
      supabase.from('email_templates').select('*').order('created_at', { ascending: false }),
      supabase.from('email_segments').select('*').order('created_at', { ascending: false }),
      supabase.from('email_events').select('*').order('created_at', { ascending: false }).limit(500),
    ]);
    setCampaigns((campRes.data as any) || []);
    setSubscribers((subRes.data as any) || []);
    setTemplates((tplRes.data as any) || []);
    setSegments((segRes.data as any) || []);
    setEvents((evRes.data as any) || []);
    setLoading(false);
  };

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
      sender_email: form.sender_email,
      reply_to: form.reply_to || null,
      template_id: form.template_id || null,
      audience_type: form.audience_type,
      segment_id: form.audience_type === 'segment' ? (form.segment_id || null) : null,
      scheduled_for: status === 'scheduled' ? new Date(form.scheduled_for).toISOString() : null,
      tracking_enabled: form.tracking_enabled,
      status,
    };
    if (editId) await supabase.from('email_campaigns').update(payload).eq('id', editId);
    else await supabase.from('email_campaigns').insert(payload);
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
    const { data: row } = await supabase.from('email_campaigns').insert({
      subject: form.subject, html_content: form.html_content, preview_text: form.preview_text || null,
      sender_email: form.sender_email, reply_to: form.reply_to || null,
      template_id: form.template_id || null, audience_type: 'single',
      test_recipients: [testEmail.trim()], status: 'draft', tracking_enabled: false,
    }).select().single();
    if (!row) return;
    setSending(true);
    try {
      await supabase.functions.invoke('send-newsletter', { body: { campaign_id: row.id } });
      toast({ title: `Test sent to ${testEmail}` });
    } catch (e: any) { toast({ title: 'Test failed', description: e.message, variant: 'destructive' }); }
    setSending(false);
  };

  const handleDeleteCampaign = async (id: string) => {
    await supabase.from('email_campaigns').delete().eq('id', id);
    fetchAll(); toast({ title: 'Deleted' });
  };

  // ---------- Subscribers ----------
  const handleAddSubscriber = async () => {
    if (!newSubEmail.trim()) return;
    const tags = newSubTags.split(',').map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from('email_subscribers').insert({
      email: newSubEmail.trim().toLowerCase(),
      name: newSubName.trim() || null,
      tags: tags.length ? tags : null,
      source: 'manual',
    });
    if (error) toast({ title: 'Failed to add', description: error.message, variant: 'destructive' });
    else {
      setNewSubEmail(''); setNewSubName(''); setNewSubTags(''); setShowAddSub(false);
      fetchAll(); toast({ title: 'Subscriber added' });
    }
  };

  const handleRemoveSubscriber = async (id: string) => {
    await supabase.from('email_subscribers').delete().eq('id', id);
    fetchAll(); toast({ title: 'Removed' });
  };

  const handleImportUsers = async () => {
    setImporting(true);
    try {
      const { data: profiles } = await supabase.from('profiles').select('email, full_name');
      let imported = 0;
      for (const p of profiles || []) {
        const { error } = await supabase.from('email_subscribers').insert({
          email: p.email.toLowerCase(), name: p.full_name, source: 'import',
        });
        if (!error) imported++;
      }
      fetchAll(); toast({ title: `Imported ${imported} new subscribers` });
    } catch { toast({ title: 'Import failed', variant: 'destructive' }); }
    setImporting(false);
  };

  // ---------- Templates ----------
  const saveTemplate = async () => {
    if (!tplForm.name.trim() || !tplForm.subject.trim()) {
      toast({ title: 'Name and subject required', variant: 'destructive' }); return;
    }
    const payload = { name: tplForm.name, subject: tplForm.subject, preview_text: tplForm.preview_text || null, html_content: tplForm.html_content };
    if (tplForm.id) await supabase.from('email_templates').update(payload).eq('id', tplForm.id);
    else await supabase.from('email_templates').insert(payload);
    setShowTemplateEdit(false); setTplForm({ id: '', name: '', subject: '', preview_text: '', html_content: '' });
    fetchAll(); toast({ title: 'Template saved' });
  };
  const deleteTemplate = async (id: string) => {
    await supabase.from('email_templates').delete().eq('id', id);
    fetchAll(); toast({ title: 'Template deleted' });
  };

  // ---------- Segments ----------
  const saveSegment = async () => {
    if (!segForm.name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    const tags = segForm.tags.split(',').map(t => t.trim()).filter(Boolean);
    const payload = { name: segForm.name, description: segForm.description || null, filter_spec: { tags } };
    if (segForm.id) await supabase.from('email_segments').update(payload).eq('id', segForm.id);
    else await supabase.from('email_segments').insert(payload);
    setShowSegmentEdit(false); setSegForm({ id: '', name: '', description: '', tags: '' });
    fetchAll(); toast({ title: 'Segment saved' });
  };
  const deleteSegment = async (id: string) => {
    await supabase.from('email_segments').delete().eq('id', id);
    fetchAll(); toast({ title: 'Segment deleted' });
  };

  // ---------- Derived ----------
  const activeCount = subscribers.filter(s => s.subscribed).length;
  const filteredSubs = subscribers.filter(s =>
    s.email.toLowerCase().includes(subSearch.toLowerCase()) ||
    (s.name?.toLowerCase().includes(subSearch.toLowerCase()))
  );
  const totalSent = events.filter(e => e.event_type === 'sent').length;
  const totalOpens = events.filter(e => e.event_type === 'opened').length;
  const totalClicks = events.filter(e => e.event_type === 'clicked').length;
  const openRate = totalSent ? Math.round((totalOpens / totalSent) * 100) : 0;
  const clickRate = totalSent ? Math.round((totalClicks / totalSent) * 100) : 0;

  const statusBadge = (status: string) => {
    const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline', scheduled: 'secondary', sending: 'secondary', sent: 'default', failed: 'destructive',
    };
    return <Badge variant={map[status] || 'outline'}>{status}</Badge>;
  };

  const campaignStats = (cid: string) => {
    const evs = events.filter(e => e.campaign_id === cid);
    return {
      sent: evs.filter(e => e.event_type === 'sent').length,
      opens: evs.filter(e => e.event_type === 'opened').length,
      clicks: evs.filter(e => e.event_type === 'clicked').length,
    };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Email Marketing</h1>
          <p className="text-muted-foreground">Compose, schedule, and track promotional campaigns.</p>
        </div>

        <div className="grid sm:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><Users className="w-7 h-7 text-primary" /><div><p className="text-xl font-bold">{activeCount}</p><p className="text-xs text-muted-foreground">Active subscribers</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Mail className="w-7 h-7 text-primary" /><div><p className="text-xl font-bold">{campaigns.length}</p><p className="text-xs text-muted-foreground">Campaigns</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Eye className="w-7 h-7 text-primary" /><div><p className="text-xl font-bold">{openRate}%</p><p className="text-xs text-muted-foreground">Avg open rate</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><BarChart3 className="w-7 h-7 text-primary" /><div><p className="text-xl font-bold">{clickRate}%</p><p className="text-xs text-muted-foreground">Avg click rate</p></div></CardContent></Card>
        </div>

        <Tabs defaultValue="campaigns">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers ({subscribers.length})</TabsTrigger>
            <TabsTrigger value="segments">Segments ({segments.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Campaigns */}
          <TabsContent value="campaigns" className="space-y-4">
            <Button onClick={() => { setEditId(null); setForm({ ...DEFAULT_FORM }); setShowCompose(true); }}>
              <Plus className="w-4 h-4 mr-2" /> New Campaign
            </Button>
            {loading ? <p className="text-muted-foreground">Loading...</p> : campaigns.length === 0 ? (
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
                          <Button size="sm" variant="outline" onClick={() => { setForm({ ...DEFAULT_FORM, subject: c.subject, html_content: c.html_content, preview_text: c.preview_text || '', sender_email: c.sender_email }); setShowPreview(true); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(c.status === 'draft' || c.status === 'scheduled') && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditId(c.id);
                                setForm({
                                  subject: c.subject, html_content: c.html_content, preview_text: c.preview_text || '',
                                  sender_email: c.sender_email, reply_to: c.reply_to || '',
                                  template_id: c.template_id || '', audience_type: c.audience_type || 'all',
                                  segment_id: c.segment_id || '',
                                  scheduled_for: c.scheduled_for ? new Date(c.scheduled_for).toISOString().slice(0, 16) : '',
                                  tracking_enabled: c.tracking_enabled !== false,
                                });
                                setShowCompose(true);
                              }}>Edit</Button>
                              <Button size="sm" onClick={() => handleSend(c.id)} disabled={sending || activeCount === 0}>
                                <Send className="w-4 h-4 mr-1" /> Send now
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteCampaign(c.id)}><Trash2 className="w-4 h-4" /></Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
              <Input placeholder="Search…" value={subSearch} onChange={e => setSubSearch(e.target.value)} className="max-w-xs" />
            </div>
            {filteredSubs.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No subscribers.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {filteredSubs.map(s => (
                  <Card key={s.id}>
                    <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-medium">{s.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.name && `${s.name} · `}{s.source} · {format(new Date(s.subscribed_at), 'MMM d, yyyy')}
                          {s.tags?.length ? ` · ${s.tags.join(', ')}` : ''}
                          {s.last_open_at && ` · last open ${format(new Date(s.last_open_at), 'MMM d')}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={s.subscribed ? 'default' : 'destructive'}>{s.subscribed ? 'Active' : 'Unsub.'}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveSubscriber(s.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
                {events.length === 0 ? <p className="text-sm text-muted-foreground">No events yet.</p> : (
                  <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {events.slice(0, 100).map(e => (
                      <div key={e.id} className="text-xs flex items-center gap-3 py-1 border-b border-border/40">
                        <Badge variant="outline" className="capitalize">{e.event_type}</Badge>
                        <span className="text-muted-foreground">{e.recipient_email || '—'}</span>
                        {e.url && <span className="text-muted-foreground truncate max-w-[300px]">{e.url}</span>}
                        <span className="ml-auto text-muted-foreground">{format(new Date(e.created_at), 'MMM d HH:mm')}</span>
                      </div>
                    ))}
                  </div>
                )}
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
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">From</label>
                <Input value={form.sender_email} onChange={e => setForm({ ...form, sender_email: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Reply-to</label>
                <Input value={form.reply_to} onChange={e => setForm({ ...form, reply_to: e.target.value })} />
              </div>
            </div>
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
