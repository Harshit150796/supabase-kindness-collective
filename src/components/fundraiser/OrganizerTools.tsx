import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { callFn } from '@/lib/serverActions';
import { useFundraiserUpdates } from '@/components/fundraiser/campaign/UpdatesSection';
import { timeAgo } from '@/hooks/useFundraiserLive';

interface Row { id: string; role: string; status: string; invite_email: string | null; user_id: string | null }
interface Settings { allow_messages: boolean; show_full_name: boolean; beneficiary_display_name: string | null; show_beneficiary_name: boolean }

export function OrganizerTools({ fundraiserId, isOwner }: { fundraiserId: string; isOwner: boolean }) {
  const { toast } = useToast();
  const [team, setTeam] = useState<Row[]>([]);
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [notify, setNotify] = useState(true);
  const [refresh, setRefresh] = useState(0); const [busy, setBusy] = useState(false);
  const [s, setS] = useState<Settings | null>(null);
  const updates = useFundraiserUpdates(fundraiserId, refresh);

  const loadTeam = useCallback(async () => {
    const { data } = await supabase.from('fundraiser_team').select('id,role,status,invite_email,user_id').eq('fundraiser_id', fundraiserId).order('created_at');
    setTeam((data ?? []) as Row[]);
  }, [fundraiserId]);
  useEffect(() => { loadTeam(); }, [loadTeam]);
  useEffect(() => {
    supabase.from('fundraisers').select('allow_messages,show_full_name,beneficiary_display_name,show_beneficiary_name').eq('id', fundraiserId).maybeSingle().then(({ data }) => data && setS(data as Settings));
  }, [fundraiserId]);

  const invite = async () => {
    setBusy(true);
    const r = await callFn<{ email_sent: boolean }>('fundraiser-actions', { action: 'invite', fundraiser_id: fundraiserId, email: email.trim() });
    setBusy(false);
    if (r.error) return toast({ title: 'Could not invite', description: r.error, variant: 'destructive' });
    toast({ title: 'Invitation created', description: r.data?.email_sent ? 'We emailed them a link to join.' : 'The invitation email could not be sent right now.' });
    setEmail(''); loadTeam();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from('fundraiser_team').delete().eq('id', id);
    if (error) toast({ title: 'Could not remove', variant: 'destructive' }); else loadTeam();
  };
  const post = async () => {
    setBusy(true);
    const r = await callFn('fundraiser-actions', { action: 'update', fundraiser_id: fundraiserId, title, body, notify_donors: notify });
    setBusy(false);
    if (r.error) return toast({ title: 'Not posted', description: r.error, variant: 'destructive' });
    toast({ title: 'Update posted' }); setTitle(''); setBody(''); setRefresh((x) => x + 1);
  };
  const delUpdate = async (id: string) => { await supabase.from('fundraiser_updates').delete().eq('id', id); setRefresh((x) => x + 1); };
  const save = async () => {
    if (!s) return;
    const { error } = await supabase.from('fundraisers').update({ ...s, beneficiary_display_name: s.beneficiary_display_name?.trim().slice(0, 80) || null }).eq('id', fundraiserId);
    toast(error ? { title: 'Could not save', variant: 'destructive' } : { title: 'Settings saved' });
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
          <Button onClick={post} disabled={busy || !title.trim() || !body.trim()}>Post update</Button>
          <ul className="divide-y divide-border">
            {updates.map((u) => (
              <li key={u.id} className="flex items-start justify-between gap-3 py-3">
                <div><p className="font-medium">{u.title}</p><p className="text-sm text-muted-foreground">{timeAgo(u.created_at)}</p></div>
                <Button size="icon" variant="ghost" onClick={() => delUpdate(u.id)} aria-label="Delete update"><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="team" className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">Co-organizers can reply to messages, post updates and hide comments. They can never change the beneficiary or where coupons go.</p>
          {isOwner && (
            <div className="flex gap-2">
              <Input type="email" placeholder="Co-organizer's email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button onClick={invite} disabled={busy || !email.includes('@')}>Invite</Button>
            </div>
          )}
          <ul className="divide-y divide-border">
            {team.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div><p className="font-medium">{t.role === 'organizer' ? (isOwner ? 'You' : 'Organizer') : t.invite_email ?? 'Co-organizer'}</p><p className="text-sm text-muted-foreground">{t.role === 'organizer' ? 'Organizer' : `Co-organizer · ${t.status}`}</p></div>
                {isOwner && t.role !== 'organizer' && <Button size="sm" variant="ghost" onClick={() => remove(t.id)}>Remove</Button>}
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
            <Button onClick={save}>Save settings</Button>
          </TabsContent>
        )}
      </Tabs>
    </section>
  );
}
