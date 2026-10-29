import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { rpc, fmtDate } from '@/lib/adminApi';
import { toast } from '@/hooks/use-toast';
import { safeHref } from '@/lib/safeUrl';
import { LINKS } from '@/lib/profiles';
import { ProfileAvatar } from '@/components/profile/ProfileBits';

type P = {
  user_id: string; username: string | null; display_name: string | null; full_name: string | null; email: string;
  avatar_url: string | null; cover_url: string | null; bio: string | null; links: Record<string, string>; visibility: 'private' | 'public';
  hidden: boolean; hidden_reason: string | null; restrictions: string[]; created_at: string; followers: number; following: number;
  open_reports: number; conversations: number;
};
const name = (p: P) => p.display_name || p.full_name || p.username || p.email;
const ACTIONS: Array<[string, string, (p: P) => boolean]> = [
  ['clear_avatar', 'Remove photo', (p) => !!p.avatar_url],
  ['clear_cover', 'Remove cover', (p) => !!p.cover_url],
  ['clear_bio', 'Remove bio', (p) => !!p.bio],
  ['clear_links', 'Remove links', (p) => Object.keys(p.links ?? {}).length > 0],
  ['reset_name', 'Reset profile name', (p) => !!p.display_name],
  ['reset_username', 'Reset username', (p) => !!p.username],
  ['make_private', 'Make private', (p) => p.visibility === 'public'],
];
const RESTRICTIONS: Array<[string, string]> = [['messaging', 'Sending messages'], ['profile', 'Editing their profile'], ['following', 'Following people']];

/** Public profiles: find anyone, clear anything inappropriate, hide a profile, or turn off features. */
export default function AdminProfiles() {
  const { isAdmin } = useTeamRole();
  const [params, setParams] = useSearchParams();
  const filter = params.get('filter') || 'all';
  const search = params.get('q') || '';
  const page = Math.max(0, Number(params.get('page')) || 0);
  const [sel, setSel] = useState<P | null>(null);
  const [pending, setPending] = useState<{ action: string; label: string } | null>(null);
  const [limits, setLimits] = useState<string[]>([]);
  const set = (key: string, value: string | null) => setParams((p) => { if (value) p.set(key, value); else p.delete(key); if (key !== 'page') p.delete('page'); return p; });

  const q = useQuery({
    queryKey: ['adm-profiles', filter, search, page], enabled: isAdmin,
    queryFn: () => rpc<{ rows: P[]; total: number }>('admin_list_profiles', { _search: search, _filter: filter, _limit: 25, _offset: page * 25 }),
  });
  const openUid = async (uid: string) => {
    const r = await rpc<{ rows: P[] }>('admin_list_profiles', { _search: '', _filter: 'all', _limit: 1, _offset: 0, _uid: uid }).catch(() => null);
    if (r?.rows[0]) setSel(r.rows[0]); else toast({ title: 'Person not found', variant: 'destructive' });
  };
  useEffect(() => { const uid = params.get('uid'); if (uid && isAdmin) { openUid(uid); set('uid', null); } }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setLimits(sel?.restrictions ?? []); }, [sel]);

  const reload = async () => { await q.refetch(); if (sel) await openUid(sel.user_id); };
  const act = async (action: string, reason: string | null) => {
    if (!sel) return;
    try { await rpc('admin_profile_action', { _uid: sel.user_id, _action: action, _reason: reason }); toast({ title: 'Saved' }); setPending(null); await reload(); }
    catch (e) { toast({ title: 'Could not save', description: (e as Error).message, variant: 'destructive' }); }
  };
  const saveLimits = async (reason: string) => {
    if (!sel) return;
    try { await rpc('admin_set_restrictions', { _uid: sel.user_id, _restrictions: limits, _reason: reason }); toast({ title: 'Restrictions saved' }); setPending(null); await reload(); }
    catch (e) { toast({ title: 'Could not save', description: (e as Error).message, variant: 'destructive' }); }
  };

  const cols: Column<P>[] = [
    { key: 'person', header: 'Person', cell: (p) => (
      <div className="flex min-w-0 items-center gap-3">
        <ProfileAvatar src={p.avatar_url} name={name(p)} className="h-10 w-10 text-base" />
        <div className="min-w-0"><p className="truncate font-medium">{name(p)}</p><p className="truncate text-xs text-muted-foreground">{p.username ? `@${p.username} · ` : ''}{p.email}</p></div>
      </div>
    ) },
    { key: 'vis', header: 'Profile', cell: (p) => <div className="flex flex-wrap gap-1"><Badge variant={p.visibility === 'public' ? 'default' : 'secondary'}>{p.visibility}</Badge>{p.hidden && <Badge variant="destructive">hidden</Badge>}</div> },
    { key: 'follow', header: 'Followers', align: 'right', cell: (p) => p.followers },
    { key: 'reports', header: 'Open reports', align: 'right', cell: (p) => p.open_reports ? <Badge variant="destructive">{p.open_reports}</Badge> : '0' },
    { key: 'limits', header: 'Turned off', cell: (p) => p.restrictions.length ? p.restrictions.join(', ') : '—' },
    { key: 'joined', header: 'Joined', cell: (p) => fmtDate(p.created_at) },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Profiles" description="People’s public profiles. Every change is recorded in the audit log with its reason." />
      {!isAdmin ? <p className="text-sm text-muted-foreground">Administrator access is required for profiles.</p> : <>
        <div className="mb-3 flex flex-wrap gap-2">
          <Input className="max-w-sm" aria-label="Search people" placeholder="Name, @username or email" value={search} onChange={(e) => set('q', e.target.value)} />
          <Select value={filter} onValueChange={(v) => set('filter', v)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{[['all', 'Everyone'], ['public', 'Public profiles'], ['private', 'Private profiles'], ['reported', 'Reported'], ['hidden', 'Hidden by team'], ['restricted', 'With features off']].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <DataTable columns={cols} rows={q.data?.rows} total={q.data?.total} loading={q.isLoading} error={q.error ? (q.error as Error).message : null} onRetry={() => q.refetch()}
          page={page} pageSize={25} onPage={(p) => set('page', String(p))} rowKey={(p) => p.user_id} onRowClick={(p) => setSel(p)} empty="No one matches this view." />
      </>}

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {sel && <>
            <SheetHeader><SheetTitle>{name(sel)}</SheetTitle><SheetDescription>{sel.email} · joined {fmtDate(sel.created_at)}</SheetDescription></SheetHeader>
            <div className="mt-4 aspect-[3/1] overflow-hidden rounded-md bg-primary-20">{sel.cover_url && <img src={sel.cover_url} alt="Cover" className="h-full w-full object-cover" />}</div>
            <div className="-mt-8 flex items-end gap-3 px-3"><ProfileAvatar src={sel.avatar_url} name={name(sel)} className="h-16 w-16 text-2xl ring-4 ring-background" />
              <div className="pb-1 text-sm">{sel.username ? `@${sel.username}` : 'No username'} · {sel.visibility}{sel.hidden ? ' · hidden' : ''}</div></div>
            {sel.bio && <p className="mt-3 text-sm">{sel.bio}</p>}
            {Object.keys(sel.links ?? {}).length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">{LINKS.filter((l) => sel.links[l.key]).map((l) => <li key={l.key}>{l.label}: <a className="text-primary" href={safeHref(l.url(sel.links[l.key]))} target="_blank" rel="noopener noreferrer nofollow">{sel.links[l.key]}</a></li>)}</ul>
            )}
            {sel.hidden && <p className="mt-3 rounded-md bg-destructive/10 p-2 text-sm">Hidden: {sel.hidden_reason}</p>}
            <p className="mt-3 text-sm text-muted-foreground">{sel.followers} followers · {sel.following} following · {sel.open_reports} open reports · {sel.conversations} conversations started</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sel.username && <Button size="sm" variant="outline" asChild><Link to={`/u/${sel.username}`} target="_blank">Public profile<ExternalLink className="ml-1 h-3.5 w-3.5" /></Link></Button>}
              <Button size="sm" variant="outline" asChild><Link to={`/admin/messages?user=${sel.user_id}`}>Their conversations</Link></Button>
              {sel.open_reports > 0 && <Button size="sm" variant="outline" asChild><Link to="/admin/moderation?kind=reports">Reports</Link></Button>}
            </div>

            <h3 className="mt-6 font-medium">Clean up</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {ACTIONS.filter(([, , show]) => show(sel)).map(([a, l]) => <Button key={a} size="sm" variant="outline" onClick={() => setPending({ action: a, label: l })}>{l}</Button>)}
              {sel.hidden
                ? <Button size="sm" variant="outline" onClick={() => act('unhide', null)}>Unhide profile</Button>
                : <Button size="sm" variant="destructive" onClick={() => setPending({ action: 'hide', label: 'Hide profile' })}>Hide profile</Button>}
            </div>

            <h3 className="mt-6 font-medium">Turn off for this person</h3>
            <div className="mt-2 space-y-2">
              {RESTRICTIONS.map(([k, l]) => (
                <Label key={k} className="flex items-center gap-2 font-normal"><Checkbox checked={limits.includes(k)} onCheckedChange={(v) => setLimits((s) => v ? [...s, k] : s.filter((x) => x !== k))} />{l}</Label>
              ))}
              <Button size="sm" disabled={JSON.stringify([...limits].sort()) === JSON.stringify([...sel.restrictions].sort())} onClick={() => setPending({ action: 'restrictions', label: 'Save restrictions' })}>Save</Button>
            </div>
          </>}
        </SheetContent>
      </Sheet>

      <ReasonDialog open={!!pending} title={pending ? `${pending.label}?` : ''}
        description={pending?.action === 'hide' ? 'Only they will see their profile, with a note to contact support.' : pending?.action === 'restrictions' ? 'They’ll see a message to contact support when they try.' : 'They can add it again unless you also turn off profile editing.'}
        confirm={pending?.label ?? 'Save'} destructive={pending?.action !== 'restrictions'}
        onCancel={() => setPending(null)} onConfirm={(r) => pending?.action === 'restrictions' ? saveLimits(r) : act(pending!.action, r)} />
    </DashboardLayout>
  );
}
