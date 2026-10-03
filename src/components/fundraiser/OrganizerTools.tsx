import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { callFn } from '@/lib/serverActions';
import { useFundraiserUpdates } from '@/components/fundraiser/campaign/UpdatesSection';
import { timeAgo } from '@/hooks/useFundraiserLive';

interface Row { id: string; role: string; status: string; invite_email: string | null; user_id: string | null }
interface Settings { allow_messages: boolean; show_full_name: boolean; beneficiary_display_name: string | null; show_beneficiary_name: boolean }

const STATUS_LABEL: Record<string, string> = { pending: 'Invited', accepted: 'Joined', revoked: 'Removed' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Confirm({ title, description, action, onConfirm, children }: { title: string; description: string; action: string; onConfirm: () => void; children: React.ReactNode }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onConfirm}>{action}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function OrganizerTools({ fundraiserId, isOwner }: { fundraiserId: string; isOwner: boolean }) {
  const { toast } = useToast();
  const [team, setTeam] = useState<Row[]>([]);
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [notify, setNotify] = useState(true);
  const [refresh, setRefresh] = useState(0); const [busy, setBusy] = useState(false);
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [donations, setDonations] = useState<number | null>(null);
  const updates = useFundraiserUpdates(fundraiserId, refresh);

  const loadTeam = useCallback(async () => {
    const { data, error } = await supabase.from('fundraiser_team').select('id,role,status,invite_email,user_id').eq('fundraiser_id', fundraiserId).order('created_at');
    if (error) toast({ title: 'Could not load team', description: error.message, variant: 'destructive' });
    setTeam((data ?? []) as Row[]);
  }, [fundraiserId, toast]);
  useEffect(() => { loadTeam(); }, [loadTeam]);
  useEffect(() => {
    supabase.from('fundraisers').select('allow_messages,show_full_name,beneficiary_display_name,show_beneficiary_name').eq('id', fundraiserId).maybeSingle()
      .then(({ data }) => { if (data) { setS(data as Settings); setSaved(data as Settings); } });
    supabase.rpc('get_fundraiser_totals', { _fundraiser_id: fundraiserId }).then(({ data }) => {
      const r = Array.isArray(data) ? data[0] : data;
      setDonations(r ? Number((r as { donations_count: number }).donations_count ?? 0) : 0);
    });
  }, [fundraiserId]);

  const dirty = useMemo(() => !!s && !!saved && JSON.stringify(s) !== JSON.stringify(saved), [s, saved]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const invite = async () => {
    const em = email.trim();
    if (!EMAIL_RE.test(em)) return toast({ title: 'Please enter a valid email address', variant: 'destructive' });
    setBusy(true);
    const r = await callFn<{ email_sent: boolean }>('fundraiser-actions', { action: 'invite', fundraiser_id: fundraiserId, email: em });
    setBusy(false);
    if (r.error) return toast({ title: 'Could not invite', description: r.error, variant: 'destructive' });
    toast({ title: 'Invitation sent', description: r.data?.email_sent ? `We emailed ${em} a link to join.` : 'The invitation was created, but the email could not be sent right now. Try "Resend invite" later.' });
    setEmail(''); loadTeam();
  };
  const resend = async (id: string) => {
    setBusy(true);
    const r = await callFn<{ email_sent: boolean }>('fundraiser-actions', { action: 'resend_invite', team_id: id });
    setBusy(false);
    if (r.error) return toast({ title: 'Could not resend', description: r.error, variant: 'destructive' });
    toast(r.data?.email_sent ? { title: 'Invite resent', description: 'A fresh link was emailed. The old link no longer works.' } : { title: 'Email not sent', description: 'Please try again shortly.', variant: 'destructive' });
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from('fundraiser_team').delete().eq('id', id);
    if (error) return toast({ title: 'Could not remove', description: error.message, variant: 'destructive' });
    toast({ title: 'Co-organizer removed' }); loadTeam();
  };
  const post = async () => {
    setBusy(true);
    const r = await callFn('fundraiser-actions', { action: 'update', fundraiser_id: fundraiserId, title: title.trim(), body: body.trim(), notify_donors: notify });
    setBusy(false);
    if (r.error) return toast({ title: 'Update not posted', description: r.error, variant: 'destructive' });
    toast({ title: 'Update posted', description: notify ? 'Donors with an account will get an email within a few minutes.' : undefined });
    setTitle(''); setBody(''); setRefresh((x) => x + 1);
  };
  const delUpdate = async (id: string) => {
    const { error } = await supabase.from('fundraiser_updates').delete().eq('id', id);
    if (error) return toast({ title: 'Could not delete update', description: error.message, variant: 'destructive' });
    toast({ title: 'Update deleted' }); setRefresh((x) => x + 1);
  };
  const save = async () => {
    if (!s || saving) return;
    setSaving(true);
    const next = { ...s, beneficiary_display_name: s.beneficiary_display_name?.trim().slice(0, 80) || null };
    const { error } = await supabase.from('fundraisers').update(next).eq('id', fundraiserId);
    setSaving(false);
    if (error) return toast({ title: 'Could not save settings', description: error.message, variant: 'destructive' });
    setS(next); setSaved(next); toast({ title: 'Settings saved' });
  };

  return (
    <section className="mt-10 rounded-[1.5rem] bg-card p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl font-normal">Organizer tools</h2>
        <Button variant="outline" asChild><Link to="/messages"><MessageCircle className="mr-2 h-4 w-4" />Inbox</Link></Button>
      </div>
      <Tabs defaultValue="updates" className="mt-6">
        <TabsList><TabsTrigger value="updates">Updates</TabsTrigger><TabsTrigger value="team">Team</TabsTrigger>{isOwner && <TabsTrigger value="settings">Settings</TabsTrigger>}</TabsList>

        <TabsContent value="updates" className="space-y-4 pt-4">
          <Input placeholder="Update title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} />
          <Textarea placeholder="What's new?" value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} rows={5} />
          <label className="flex items-center gap-2 text-sm"><Switch checked={notify} onCheckedChange={setNotify} />Email donors about this update</label>
          {notify && <p className="text-sm text-muted-foreground">{donations ? `Sent to donors with an account (from ${donations} completed donation${donations === 1 ? '' : 's'}). Guest donors aren't emailed.` : 'No completed donations yet, so no one will be emailed.'}</p>}
          <Button onClick={post} disabled={busy || !title.trim() || !body.trim()}>{busy ? 'Posting…' : 'Post update'}</Button>
          <ul className="divide-y divide-border">
            {updates.map((u) => (
              <li key={u.id} className="flex items-start justify-between gap-3 py-3">
                <div><p className="font-medium">{u.title}</p><p className="text-sm text-muted-foreground">{timeAgo(u.created_at)}</p></div>
                <Confirm title="Delete this update?" description="It will be removed from your fundraiser page. This can't be undone." action="Delete" onConfirm={() => delUpdate(u.id)}>
                  <Button size="icon" variant="ghost" aria-label="Delete update"><Trash2 className="h-4 w-4" /></Button>
                </Confirm>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="team" className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">Co-organizers can reply to messages, post updates and hide comments. They can never change the beneficiary or where coupons go. Up to 10 people per team.</p>
          {isOwner && (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); invite(); }}>
              <Input type="email" placeholder="Co-organizer's email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
              <Button type="submit" disabled={busy || !email.trim()}>{busy ? 'Sending…' : 'Invite'}</Button>
            </form>
          )}
          <ul className="divide-y divide-border">
            {team.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{t.role === 'organizer' ? (isOwner ? 'You' : 'Organizer') : t.invite_email ?? 'Co-organizer'}</p>
                  <p className="text-sm text-muted-foreground">{t.role === 'organizer' ? 'Organizer' : `Co-organizer · ${STATUS_LABEL[t.status] ?? t.status}`}</p>
                </div>
                {isOwner && t.role !== 'organizer' && (
                  <div className="flex gap-1">
                    {t.status === 'pending' && <Button size="sm" variant="outline" disabled={busy} onClick={() => resend(t.id)}>Resend invite</Button>}
                    <Confirm title="Remove this co-organizer?" description={`${t.invite_email ?? 'This person'} will lose access to this fundraiser's tools.`} action="Remove" onConfirm={() => remove(t.id)}>
                      <Button size="sm" variant="ghost">Remove</Button>
                    </Confirm>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </TabsContent>

        {isOwner && s && (
          <TabsContent value="settings" className="space-y-5 pt-4">
            <label className="flex items-center justify-between gap-4"><span><span className="font-medium">Allow supporters to message me</span><span className="block text-sm text-muted-foreground">Messages are relayed — your email and phone stay private.</span></span><Switch checked={s.allow_messages} onCheckedChange={(v) => setS({ ...s, allow_messages: v })} /></label>
            <label className="flex items-center justify-between gap-4"><span><span className="font-medium">Show my full name</span><span className="block text-sm text-muted-foreground">Otherwise shown as first name and last initial.</span></span><Switch checked={s.show_full_name} onCheckedChange={(v) => setS({ ...s, show_full_name: v })} /></label>
            <div className="space-y-2">
              <Label>Beneficiary name (optional)</Label>
              <Input value={s.beneficiary_display_name ?? ''} onChange={(e) => setS({ ...s, beneficiary_display_name: e.target.value })} maxLength={80} />
              <label className="flex items-center gap-2 text-sm"><Switch checked={s.show_beneficiary_name} onCheckedChange={(v) => setS({ ...s, show_beneficiary_name: v })} />Show beneficiary name publicly</label>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save settings'}</Button>
              {dirty && <span className="text-sm text-muted-foreground">You have unsaved changes.</span>}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </section>
  );
}
