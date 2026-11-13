import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink, Images, LayoutGrid, CircleAlert } from 'lucide-react';
import { useTeamRole } from '@/components/admin/AdminLayout';
import { StatusBadge } from '@/components/admin/DataTable';
import { sb, rpc, usd, fmtDate } from '@/lib/adminApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RecordWork } from '@/components/admin/RecordWork';
import { useAuth } from '@/hooks/useAuth';
import { FundraiserImagesTab } from '@/components/admin/FundraiserImagesTab';
import { FundraiserCouponsTab } from '@/components/admin/FundraiserCouponsTab';
import { FundraiserContactTab } from '@/components/admin/FundraiserContactTab';
import { cityState, needLabel, requestNeeds } from '@/lib/helpNeeds';
import { fundraiserPublicUrl, fundraiserShareUrl } from '@/lib/fundraiserSharing';
import { FundraiserThumb } from './FundraiserThumb';
import { PhoneLink } from '@/components/admin/PhoneLink';
import { FundraiserRow, ago, pageChecks, percent, progressOf, usdWhole } from './fundraiserList';

const CATEGORIES = ['food', 'meals', 'healthcare', 'childcare', 'clothing', 'education', 'transportation', 'utilities', 'essentials', 'emergency'];

/** One fundraiser, opened from the list: what it needs, what it raised, and every tool for it. */
export function FundraiserDrawer({ id, onClose, onPrev, onNext, position }: {
  id: string | null; onClose: () => void; onPrev?: () => void; onNext?: () => void; position?: string | null;
}) {
  const qc = useQueryClient();
  const { isAdmin, canWrite } = useTeamRole();
  const [confirm, setConfirm] = useState<null | 'reject' | 'archive' | 'delete'>(null);
  const [reason, setReason] = useState('');
  const [typed, setTyped] = useState('');
  const [edit, setEdit] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [fullStory, setFullStory] = useState(false);
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') ?? 'overview');
  const [featureOrder, setFeatureOrder] = useState('');
  const couponDirty = useRef(false);
  const dirtyGroups = useRef(new Set<string>());
  const markCouponDirty = (key: string, dirty: boolean) => { if (dirty) dirtyGroups.current.add(key); else dirtyGroups.current.delete(key); couponDirty.current = dirtyGroups.current.size > 0; };
  const unsaved = () => !!edit || couponDirty.current;
  const leave = (go: () => void) => { if (unsaved() && !window.confirm('Discard unsaved changes?')) return; setEdit(null); couponDirty.current = false; dirtyGroups.current.clear(); go(); };
  const changeTab = (t: string) => { if (couponDirty.current && !window.confirm('Discard unsaved coupon changes?')) return; couponDirty.current = false; dirtyGroups.current.clear(); setTab(t); setParams((p) => { p.set('tab', t); return p; }, { replace: true }); };
  const close = () => leave(onClose);
  useEffect(() => { setEdit(null); setConfirm(null); setReason(''); setFullStory(false); couponDirty.current = false; dirtyGroups.current.clear(); setTab(params.get('tab') ?? 'overview'); }, [id, user?.id]);
  useEffect(() => { const guard = (e: BeforeUnloadEvent) => { if (unsaved()) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard); }, [edit]);

  // J / K (or [ and ]) step through the list while the drawer is open, unless someone is typing.
  useEffect(() => {
    if (!id) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || el?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"] [role="dialog"]')) return;
      if ((e.key === 'j' || e.key === ']') && onNext) { e.preventDefault(); leave(onNext); }
      if ((e.key === 'k' || e.key === '[') && onPrev) { e.preventDefault(); leave(onPrev); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const d = useQuery({
    queryKey: ['adm-fr-detail', id, user?.id, isAdmin], enabled: !!id,
    queryFn: async () => {
      const [f, row, dons, upd, com, team, conv, rep, audit] = await Promise.all([
        sb.from('fundraisers').select('*').eq('id', id).single(),
        rpc<FundraiserRow[]>('admin_fundraiser_list', { _ids: [id], _limit: 1 }).catch(() => []),
        sb.from('donations').select('id,amount,status,donor_name,is_anonymous,payment_provider,created_at').eq('fundraiser_id', id).order('created_at', { ascending: false }).limit(50),
        sb.from('fundraiser_updates').select('id,title,created_at').eq('fundraiser_id', id).order('created_at', { ascending: false }).limit(50),
        sb.from('fundraiser_comments').select('id,display_name,body,is_hidden,created_at').eq('fundraiser_id', id).order('created_at', { ascending: false }).limit(50),
        sb.from('fundraiser_team').select('id,role,status,invite_email,created_at').eq('fundraiser_id', id),
        sb.from('conversations').select('id,status,last_message_at,created_at').eq('fundraiser_id', id).order('last_message_at', { ascending: false }).limit(50),
        sb.from('content_reports').select('id,reason,status,target_type,created_at').eq('fundraiser_id', id).order('created_at', { ascending: false }),
        isAdmin ? sb.from('admin_audit_log').select('id,action,actor_id,created_at').eq('table_name', 'fundraisers').eq('record_id', id).order('created_at', { ascending: false }).limit(50) : Promise.resolve({ data: [] }),
      ]);
      if (f.error) throw f.error;
      return { f: f.data, row: (row as FundraiserRow[])[0] ?? null, dons: dons.data ?? [], upd: upd.data ?? [], com: com.data ?? [], team: team.data ?? [], conv: conv.data ?? [], rep: rep.data ?? [], audit: audit.data ?? [] };
    },
  });
  const f = d.data?.f;
  const row = d.data?.row;
  useEffect(() => { setFeatureOrder(f?.featured_order == null ? '' : String(f.featured_order)); }, [f?.id, f?.featured_order]);
  const organizer = useQuery({ queryKey: ['adm-fr-organizer', id, user?.id], enabled: !!f?.user_id, queryFn: async () => { const { data, error } = await sb.from('profiles').select('full_name,email,phone').eq('user_id', f?.user_id).maybeSingle(); if (error) throw error; return data; } });

  const refresh = () => { qc.invalidateQueries({ queryKey: ['adm-fr'] }); qc.invalidateQueries({ queryKey: ['adm-fr-counts'] }); qc.invalidateQueries({ queryKey: ['adm-fr-detail', id, user?.id, isAdmin] }); };

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    if (['approve', 'pause', 'resume', 'restore'].includes(action) && !window.confirm(`${action === 'approve' || action === 'resume' ? 'Make this fundraiser active' : action === 'pause' ? 'Pause this fundraiser' : 'Restore this fundraiser as paused'}?`)) return;
    setBusy(true);
    try {
      await rpc('admin_fundraiser_action', { _id: id, _action: action, ...extra });
      if (action === 'reject') {
        await sb.functions.invoke('fundraiser-actions', { body: { action: 'admin_notify_rejection', fundraiser_id: id, reason: extra._reason } }).catch(() => null);
      }
      toast({ title: action === 'feature' ? 'Feature order saved' : action === 'approve' ? 'Approved and live' : action === 'resume' ? 'Active again' : action === 'restore' ? 'Restored as paused' : `Fundraiser ${action}d` });
      refresh();
      setConfirm(null); setReason('');
    } catch (e) { toast({ title: 'Action failed', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(false);
  };

  const saveEdit = async () => {
    setBusy(true);
    try { await rpc('admin_update_fundraiser', { _id: id, _patch: edit }); toast({ title: 'Saved' }); setEdit(null); refresh(); }
    catch (e) { toast({ title: 'Save failed', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(false);
  };

  const hardDelete = async () => {
    setBusy(true);
    try { await rpc('admin_hard_delete_fundraiser', { _id: id, _confirm: typed }); toast({ title: 'Permanently deleted' }); setConfirm(null); onClose(); qc.invalidateQueries({ queryKey: ['adm-fr'] }); qc.invalidateQueries({ queryKey: ['adm-fr-counts'] }); }
    catch (e) { toast({ title: 'Delete refused', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(false);
  };

  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); toast({ title: `${what} copied` }); }
    catch { toast({ title: `Couldn't copy the ${what.toLowerCase()}`, description: text }); }
  };

  const List = ({ rows, render, empty }: { rows: any[]; render: (r: any) => React.ReactNode; empty: string }) =>
    rows.length ? <ul className="divide-y divide-border text-sm">{rows.map((r) => <li key={r.id} className="py-2">{render(r)}</li>)}</ul> : <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;

  const needs = f ? requestNeeds(f.help_categories, f.category) : [];
  const place = f ? cityState(f.city, f.state_code) : null;
  const checks = f && row ? pageChecks({ ...row, organizer_email: row.organizer_email ?? organizer.data?.email ?? null, organizer_phone: row.organizer_phone ?? organizer.data?.phone ?? null }) : [];
  const progress = row ? progressOf(row) : 0;
  const counts: Record<string, number> = { donations: d.data?.dons.length ?? 0, updates: d.data?.upd.length ?? 0, comments: d.data?.com.length ?? 0, team: d.data?.team.length ?? 0, conversations: d.data?.conv.length ?? 0, reports: row?.open_reports ?? 0, coupons: row?.coupons_waiting ?? 0, images: row?.photo_count ?? 0 };
  const tabs = ['overview', ...(canWrite ? ['contact'] : []), 'work', 'coupons', 'images', 'donations', 'updates', 'comments', 'team', 'conversations', 'reports', ...(isAdmin ? ['history'] : [])];
  const tabLabel = (t: string) => t === 'work' ? 'Notes & follow-ups' : t === 'contact' ? 'Contact & emails' : t === 'images' ? 'Photos' : t;

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && close()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl [&>button]:z-20">
        {!f ? <p className="p-6 text-sm text-muted-foreground">{d.error ? (d.error as Error).message : 'Loading…'}</p> : (
          <>
            <SheetHeader className="sticky top-0 z-10 -mx-6 -mt-6 border-b border-border bg-background px-6 pb-3 pt-5">
              <div className="flex items-center justify-between gap-2 pr-8 text-xs text-muted-foreground">
                <span>{position ?? ''}</span>
                <span className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" disabled={!onPrev} onClick={() => onPrev && leave(onPrev)} aria-label="Previous fundraiser (K)" title="Previous (K)"><ChevronLeft className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" disabled={!onNext} onClick={() => onNext && leave(onNext)} aria-label="Next fundraiser (J)" title="Next (J)"><ChevronRight className="h-4 w-4" /></Button>
                </span>
              </div>
              <div className="flex items-start gap-3 text-left">
                <button type="button" onClick={() => changeTab('images')} className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open photos">
                  <FundraiserThumb url={row?.photo_url ?? f.cover_photo_url ?? null} need={needs[0] ?? f.category} size={72} rounded="rounded-lg" />
                </button>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-left font-serif text-2xl font-normal leading-tight">{f.title}</SheetTitle>
                  <SheetDescription asChild>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <StatusBadge value={f.status} />
                      {f.is_example && <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium">Example</span>}
                      <span>Created {fmtDate(f.created_at)}</span>
                      {place && <span>{place}</span>}
                    </div>
                  </SheetDescription>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <a href={fundraiserPublicUrl(f.unique_slug, f.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">Public page <ExternalLink className="h-3 w-3" /></a>
                    <button type="button" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline" onClick={() => copy(fundraiserShareUrl(f.unique_slug, f.id), 'Share link')}>Copy share link <Copy className="h-3 w-3" /></button>
                    <Link to="/admin/homepage" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">Homepage lineup <LayoutGrid className="h-3 w-3" /></Link>
                  </div>
                </div>
              </div>
              <p className="break-words text-left text-xs text-muted-foreground">Created by {organizer.isLoading ? 'Loading…' : organizer.error ? 'Could not load organizer' : !organizer.data ? 'Not recorded'
                : <>{organizer.data.full_name || 'No name'}{organizer.data.email && <> · <a href={`mailto:${organizer.data.email}`} className="text-primary underline-offset-4 hover:underline">{organizer.data.email}</a></>}{organizer.data.phone && <> · <PhoneLink phone={organizer.data.phone} /></>}
                  {canWrite && <> · <button className="text-primary underline-offset-4 hover:underline" onClick={() => changeTab('contact')}>Message them</button></>}</>}</p>
            </SheetHeader>

            {canWrite && (
              <div className="mt-4 flex flex-wrap gap-2">
                {f.status === 'pending' && <Button size="sm" disabled={busy} onClick={() => act('approve')}>Approve</Button>}
                {['pending', 'active', 'paused'].includes(f.status) && <Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirm('reject')}>Reject…</Button>}
                {f.status === 'active' && <Button size="sm" variant="outline" disabled={busy} onClick={() => act('pause')}>Pause</Button>}
                {['paused', 'rejected'].includes(f.status) && <Button size="sm" variant="outline" disabled={busy} onClick={() => act('resume')}>Make active</Button>}
                {f.status !== 'archived' ? <Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirm('archive')}>Archive</Button> : <Button size="sm" variant="outline" disabled={busy} onClick={() => act('restore')}>Restore (as paused)</Button>}
                <Button size="sm" variant="outline" onClick={() => setEdit({ title: f.title, story: f.story, category: f.category, monthly_goal: f.monthly_goal, country: f.country ?? '', zip_code: f.zip_code ?? '' })}>Edit</Button>
                <Button size="sm" variant="outline" onClick={() => changeTab('images')}><Images className="mr-1.5 h-4 w-4" />Photos</Button>
                {isAdmin && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setTyped(''); setConfirm('delete'); }}>Delete permanently…</Button>}
              </div>
            )}

            <Tabs value={tab} onValueChange={changeTab} className="mt-5">
              <TabsList className="flex h-auto flex-wrap justify-start">
                {tabs.map((t) => <TabsTrigger key={t} value={t} className="capitalize">{tabLabel(t)}{counts[t] ? <span className={cn('ml-1.5 rounded px-1 text-[10px] tabular-nums', (t === 'reports' || t === 'coupons') ? 'bg-verify/15 text-verify' : 'bg-muted text-muted-foreground')}>{counts[t]}</span> : null}</TabsTrigger>)}
              </TabsList>
              {canWrite && <TabsContent value="contact"><FundraiserContactTab key={f.id} fundraiserId={f.id} title={f.title} canWrite={canWrite} /></TabsContent>}
              <TabsContent value="work"><RecordWork key={f.id} type="fundraiser" recordKey={f.id} title={f.title} /></TabsContent>
              <TabsContent value="coupons"><FundraiserCouponsTab fundraiserId={f.id} canWrite={canWrite} onDirtyChange={(v) => markCouponDirty('all', v)} /></TabsContent>
              <TabsContent value="images"><FundraiserImagesTab fundraiser={f} canWrite={canWrite} /></TabsContent>
              <TabsContent value="overview" className="space-y-5">
                {row && (
                  <section aria-label="Money and coupons" className="space-y-3">
                    <div>
                      <div className="flex items-baseline justify-between gap-2 tabular-nums">
                        <p><span className="text-2xl font-semibold">{usd(row.raised)}</span> <span className="text-sm text-muted-foreground">of {usdWhole(row.monthly_goal)} goal</span></p>
                        <p className="text-sm font-medium text-primary">{percent(progress)}</p>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} /></div>
                      <p className="mt-1 text-xs text-muted-foreground">{f.is_example ? 'Example gifts (showcase only, not real money).' : 'Completed donations plus outside gifts the team chose to show, the same rule as the public page.'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 tabular-nums sm:grid-cols-4">
                      {[
                        ['Gifts', String(row.gifts), row.last_gift_at ? `Last ${ago(row.last_gift_at)}` : 'None yet', null],
                        ['Coupons to send', String(row.coupons_waiting), row.coupons_waiting ? 'Open the Coupons tab' : 'All caught up', row.coupons_waiting ? 'coupons' : null],
                        ['Coupons ready', String(row.coupons_ready), 'Given to the family', null],
                        ['Coupons used', String(row.coupons_used), 'Marked used', null],
                      ].map(([label, value, hint, go]) => {
                        const body = <><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold">{value}</p><p className="truncate text-[11px] text-muted-foreground">{hint}</p></>;
                        return go ? <button key={label} type="button" onClick={() => changeTab(go)} className="rounded-md bg-verify/10 p-3 text-left hover:bg-verify/15">{body}</button> : <div key={label} className="rounded-md bg-muted/50 p-3">{body}</div>;
                      })}
                    </div>
                  </section>
                )}

                {checks.length > 0 && (
                  <section aria-label="Page check">
                    <h3 className="mb-1.5 text-sm font-medium">{f.status === 'pending' ? 'Before you approve' : 'Page check'}</h3>
                    <ul className="grid gap-1 text-sm sm:grid-cols-2">
                      {checks.map((c) => (
                        <li key={c.id} className="flex items-start gap-1.5">
                          {c.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : c.optional ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />}
                          <span className={c.ok ? 'text-foreground' : c.optional ? 'text-muted-foreground' : 'text-destructive'}>{c.label}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section aria-label="What they asked for" className="space-y-1 text-sm">
                  <h3 className="text-sm font-medium">What they asked for</h3>
                  <p className="text-muted-foreground">{needs.length ? needs.map(needLabel).join(', ') : 'No need chosen'}{f.beneficiary_type ? ` · for ${f.beneficiary_type === 'self' ? 'themselves' : f.beneficiary_type.replace(/_/g, ' ')}` : ''}</p>
                  {(f.preferred_brands ?? []).length > 0 && <p className="text-muted-foreground">Stores: {f.preferred_brands.join(', ')}{f.similar_stores_ok ? ' (similar stores are fine)' : ''}</p>}
                  {row && (row.homepage_position != null || row.homepage_hidden) && <p className="text-muted-foreground">{row.homepage_hidden ? 'Hidden from the homepage.' : `Homepage lineup position ${row.homepage_position}${row.homepage_pinned ? ' (pinned)' : ''}.`}</p>}
                </section>

                {f.rejection_reason && <p className="rounded-md bg-destructive/5 p-3 text-sm"><span className="font-medium">Rejection reason:</span> {f.rejection_reason}</p>}
                {canWrite && (
                  <div className="flex items-end gap-2">
                    <div><Label className="text-xs">Feature order (blank = not featured)</Label>
                      <Input type="number" min={1} className="h-9 w-40" value={featureOrder} onChange={(e) => setFeatureOrder(e.target.value)} /></div>
                    <Button size="sm" variant="outline" disabled={busy || (!!featureOrder && (!Number.isInteger(Number(featureOrder)) || Number(featureOrder) < 1))} onClick={() => act('feature', { _order: featureOrder ? Number(featureOrder) : null })}>Save</Button>
                  </div>
                )}
                <section aria-label="Story">
                  <h3 className="mb-1 text-sm font-medium">Story</h3>
                  <p className="whitespace-pre-wrap text-sm text-foreground/80">{fullStory ? f.story : f.story?.slice(0, 900)}{!fullStory && (f.story?.length ?? 0) > 900 ? '…' : ''}</p>
                  {(f.story?.length ?? 0) > 900 && <button type="button" className="mt-1 text-xs text-primary underline-offset-4 hover:underline" onClick={() => setFullStory((v) => !v)}>{fullStory ? 'Show less' : 'Show the whole story'}</button>}
                </section>
                <p className="text-xs text-muted-foreground">Stored counters (not used publicly): {usd(f.amount_raised)} / {f.donors_count ?? 0} donors.</p>
              </TabsContent>
              <TabsContent value="donations"><List rows={d.data?.dons ?? []} empty="No donations linked to this fundraiser." render={(r) => <div><div className="flex justify-between gap-2"><span>{r.is_anonymous ? 'Anonymous' : r.donor_name || 'Guest'} · <StatusBadge value={r.status} /></span><span className="tabular-nums">{usd(r.amount)} · {fmtDate(r.created_at)}</span></div>{['completed', 'succeeded'].includes(r.status) && <div className="mt-2"><FundraiserCouponsTab fundraiserId={f.id} canWrite={canWrite} donationId={r.id} onDirtyChange={(v) => markCouponDirty(r.id, v)} /></div>}</div>} /></TabsContent>
              <TabsContent value="updates"><List rows={d.data?.upd ?? []} empty="No updates posted." render={(r) => <div className="flex justify-between"><span>{r.title}</span><span className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</span></div>} /></TabsContent>
              <TabsContent value="comments"><List rows={d.data?.com ?? []} empty="No comments." render={(r) => <div><p className="text-xs text-muted-foreground">{r.display_name} · {fmtDate(r.created_at)} {r.is_hidden && '· hidden'}</p><p>{r.body}</p></div>} /></TabsContent>
              <TabsContent value="team"><List rows={d.data?.team ?? []} empty="No team members." render={(r) => <div className="flex justify-between"><span className="capitalize">{r.role}{r.invite_email ? ` · invited` : ''}</span><StatusBadge value={r.status} /></div>} /></TabsContent>
              <TabsContent value="conversations">
                <p className="mb-2 text-xs text-muted-foreground">Metadata only. Message bodies are admin-only and every view is recorded in the audit log.</p>
                <List rows={d.data?.conv ?? []} empty="No conversations." render={(r) => <ConversationRow c={r} canView={isAdmin} />} />
              </TabsContent>
              <TabsContent value="reports">{isAdmin && <Button size="sm" variant="outline" asChild><Link to={`/admin/moderation?fundraiser=${f.id}`}>Review reports</Link></Button>}<List rows={d.data?.rep ?? []} empty="No reports." render={(r) => <div className="flex justify-between"><span>{r.reason} · {r.target_type}</span><StatusBadge value={r.status} /></div>} /></TabsContent>
              <TabsContent value="history"><List rows={d.data?.audit ?? []} empty="No admin changes recorded yet." render={(r) => <div className="flex justify-between"><span>{r.action}</span><span className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</span></div>} /></TabsContent>
            </Tabs>

            {edit && (
              <div className="mt-6 space-y-3 rounded-md border border-border p-4">
                <p className="text-sm font-medium">Edit details</p>
                {(['title', 'category', 'monthly_goal', 'country', 'zip_code'] as const).map((k) => (
                  <div key={k}><Label className="text-xs capitalize">{k === 'monthly_goal' ? 'Goal' : k.replace('_', ' ')}</Label><Input value={edit[k]} list={k === 'category' ? 'fundraiser-categories' : undefined} type={k === 'monthly_goal' ? 'number' : 'text'} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></div>))}
                <datalist id="fundraiser-categories">{CATEGORIES.map((c) => <option key={c} value={c}>{needLabel(c)}</option>)}</datalist>
                <div><Label className="text-xs">Story</Label><Textarea rows={8} value={edit.story} onChange={(e) => setEdit({ ...edit, story: e.target.value })} /><p className="mt-1 text-xs text-muted-foreground">{String(edit.story ?? '').length} characters</p></div>
                <div className="flex gap-2"><Button size="sm" disabled={busy} onClick={saveEdit}>Save changes</Button><Button size="sm" variant="ghost" onClick={() => setEdit(null)}>Cancel</Button></div>
              </div>
            )}

            <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{confirm === 'reject' ? 'Reject fundraiser' : confirm === 'archive' ? 'Archive fundraiser' : 'Permanently delete'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {confirm === 'reject' && 'The organizer will be emailed this reason. The page is hidden from the public.'}
                    {confirm === 'archive' && 'Hidden from the public site. All donation and coupon records are preserved. You can restore it later.'}
                    {confirm === 'delete' && `Only allowed when there are zero donations and zero coupons. Images, team, comments, updates and conversations are destroyed. Type "${f.unique_slug ?? f.id}" to confirm.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {confirm === 'reject' && <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required)" maxLength={1000} />}
                {confirm === 'delete' && <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={f.unique_slug ?? f.id} />}
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={busy || (confirm === 'reject' && !reason.trim()) || (confirm === 'delete' && typed !== (f.unique_slug ?? f.id))}
                    onClick={(e) => { e.preventDefault(); confirm === 'reject' ? act('reject', { _reason: reason }) : confirm === 'archive' ? act('archive') : hardDelete(); }}>
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ConversationRow({ c, canView }: { c: any; canView: boolean }) {
  const [msgs, setMsgs] = useState<any[] | null>(null);
  return (
    <div>
      <div className="flex justify-between"><span><StatusBadge value={c.status} /> · last message {fmtDate(c.last_message_at)}</span>
        {canView && !msgs && <button className="text-xs text-primary" onClick={async () => { try { setMsgs(await rpc('admin_view_conversation', { _cid: c.id })); } catch (e) { toast({ title: (e as Error).message, variant: 'destructive' }); } }}>View messages (audited)</button>}</div>
      {msgs && <ul className="mt-2 space-y-1 rounded bg-muted/40 p-2 text-xs">{msgs.map((m) => <li key={m.id}><span className="text-muted-foreground">{fmtDate(m.created_at)}:</span> {m.body}</li>)}</ul>}
    </div>
  );
}
