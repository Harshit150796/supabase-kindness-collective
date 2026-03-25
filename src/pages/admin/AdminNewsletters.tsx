import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Plus, Send, Users, Mail, Trash2, Upload, Eye } from 'lucide-react';

interface Campaign {
  id: string;
  subject: string;
  html_content: string;
  preview_text: string | null;
  sender_email: string;
  status: string;
  sent_count: number;
  total_recipients: number;
  created_at: string;
  sent_at: string | null;
}

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  subscribed: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
  source: string;
}

export default function AdminNewsletters() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [sending, setSending] = useState(false);
  const [importing, setImporting] = useState(false);

  const [form, setForm] = useState({
    subject: '',
    html_content: '',
    preview_text: '',
    sender_email: 'updates@coupondonation.com',
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [subSearch, setSubSearch] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [campRes, subRes] = await Promise.all([
      supabase.from('email_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('email_subscribers').select('*').order('created_at', { ascending: false }),
    ]);
    setCampaigns((campRes.data as Campaign[]) || []);
    setSubscribers((subRes.data as Subscriber[]) || []);
    setLoading(false);
  };

  const handleSaveCampaign = async () => {
    if (!form.subject.trim() || !form.html_content.trim()) {
      toast({ title: 'Subject and content are required', variant: 'destructive' });
      return;
    }
    if (editId) {
      await supabase.from('email_campaigns').update(form).eq('id', editId);
    } else {
      await supabase.from('email_campaigns').insert(form);
    }
    setShowCompose(false);
    setEditId(null);
    setForm({ subject: '', html_content: '', preview_text: '', sender_email: 'updates@coupondonation.com' });
    fetchAll();
    toast({ title: editId ? 'Campaign updated' : 'Campaign created' });
  };

  const handleSend = async (campaignId: string) => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-newsletter', {
        body: { campaign_id: campaignId },
      });
      if (error) throw error;
      toast({ title: `Sent ${data.sent} emails${data.failed > 0 ? `, ${data.failed} failed` : ''}` });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
    }
    setSending(false);
  };

  const handleDeleteCampaign = async (id: string) => {
    await supabase.from('email_campaigns').delete().eq('id', id);
    fetchAll();
    toast({ title: 'Campaign deleted' });
  };

  const handleAddSubscriber = async () => {
    if (!newSubEmail.trim()) return;
    const { error } = await supabase.from('email_subscribers').insert({
      email: newSubEmail.trim().toLowerCase(),
      name: newSubName.trim() || null,
      source: 'manual',
    });
    if (error) {
      toast({ title: 'Failed to add', description: error.message, variant: 'destructive' });
    } else {
      setNewSubEmail('');
      setNewSubName('');
      setShowAddSub(false);
      fetchAll();
      toast({ title: 'Subscriber added' });
    }
  };

  const handleRemoveSubscriber = async (id: string) => {
    await supabase.from('email_subscribers').delete().eq('id', id);
    fetchAll();
    toast({ title: 'Subscriber removed' });
  };

  const handleImportUsers = async () => {
    setImporting(true);
    try {
      const { data: profiles } = await supabase.from('profiles').select('email, full_name');
      if (!profiles || profiles.length === 0) {
        toast({ title: 'No users to import' });
        setImporting(false);
        return;
      }
      let imported = 0;
      for (const p of profiles) {
        const { error } = await supabase.from('email_subscribers').insert({
          email: p.email.toLowerCase(),
          name: p.full_name,
          source: 'import',
        });
        if (!error) imported++;
      }
      fetchAll();
      toast({ title: `Imported ${imported} new subscribers` });
    } catch {
      toast({ title: 'Import failed', variant: 'destructive' });
    }
    setImporting(false);
  };

  const activeCount = subscribers.filter(s => s.subscribed).length;
  const filteredSubs = subscribers.filter(s =>
    s.email.toLowerCase().includes(subSearch.toLowerCase()) ||
    (s.name?.toLowerCase().includes(subSearch.toLowerCase()))
  );

  const statusBadge = (status: string) => {
    const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline', sending: 'secondary', sent: 'default', failed: 'destructive',
    };
    return <Badge variant={map[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Newsletters</h1>
            <p className="text-muted-foreground">Send email campaigns to your subscribers</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Active Subscribers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Mail className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{campaigns.length}</p>
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Send className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {campaigns.reduce((sum, c) => sum + c.sent_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Emails Sent</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="campaigns">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers ({subscribers.length})</TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            <Button onClick={() => { setEditId(null); setForm({ subject: '', html_content: '', preview_text: '', sender_email: 'updates@coupondonation.com' }); setShowCompose(true); }}>
              <Plus className="w-4 h-4 mr-2" /> New Campaign
            </Button>

            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : campaigns.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No campaigns yet. Create your first one!</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {campaigns.map(c => (
                  <Card key={c.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{c.subject}</p>
                          {statusBadge(c.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          From: {c.sender_email} · {format(new Date(c.created_at), 'MMM d, yyyy')}
                          {c.sent_at && ` · Sent: ${format(new Date(c.sent_at), 'MMM d, yyyy HH:mm')}`}
                          {c.sent_count > 0 && ` · ${c.sent_count}/${c.total_recipients} delivered`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setForm({ subject: c.subject, html_content: c.html_content, preview_text: c.preview_text || '', sender_email: c.sender_email }); setShowPreview(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {c.status === 'draft' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => { setEditId(c.id); setForm({ subject: c.subject, html_content: c.html_content, preview_text: c.preview_text || '', sender_email: c.sender_email }); setShowCompose(true); }}>
                              Edit
                            </Button>
                            <Button size="sm" onClick={() => handleSend(c.id)} disabled={sending || activeCount === 0}>
                              <Send className="w-4 h-4 mr-1" /> Send
                            </Button>
                          </>
                        )}
                        {c.status === 'draft' && (
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteCampaign(c.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers" className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setShowAddSub(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Subscriber
              </Button>
              <Button variant="outline" onClick={handleImportUsers} disabled={importing}>
                <Upload className="w-4 h-4 mr-2" /> {importing ? 'Importing...' : 'Import from Users'}
              </Button>
              <Input placeholder="Search subscribers..." value={subSearch} onChange={e => setSubSearch(e.target.value)} className="max-w-xs" />
            </div>

            {filteredSubs.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No subscribers yet.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {filteredSubs.map(s => (
                  <Card key={s.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{s.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.name && `${s.name} · `}
                          {s.source} · {format(new Date(s.subscribed_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={s.subscribed ? 'default' : 'destructive'}>
                          {s.subscribed ? 'Active' : 'Unsubscribed'}
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveSubscriber(s.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Compose Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Campaign' : 'New Campaign'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Subject *</label>
              <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Your weekly update from CouponDonation" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Preview Text</label>
              <Input value={form.preview_text} onChange={e => setForm({ ...form, preview_text: e.target.value })} placeholder="Short preview shown in inbox" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Sender Email</label>
              <Input value={form.sender_email} onChange={e => setForm({ ...form, sender_email: e.target.value })} placeholder="updates@coupondonation.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">HTML Content *</label>
              <Textarea value={form.html_content} onChange={e => setForm({ ...form, html_content: e.target.value })} placeholder="<h1>Hello!</h1><p>Your weekly update...</p>" rows={12} className="font-mono text-xs" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
              <Button onClick={handleSaveCampaign}>Save as Draft</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {form.subject}</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            <div dangerouslySetInnerHTML={{ __html: form.html_content }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Subscriber Dialog */}
      <Dialog open={showAddSub} onOpenChange={setShowAddSub}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subscriber</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Email *" value={newSubEmail} onChange={e => setNewSubEmail(e.target.value)} />
            <Input placeholder="Name (optional)" value={newSubName} onChange={e => setNewSubName(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddSub(false)}>Cancel</Button>
              <Button onClick={handleAddSubscriber}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
