import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ExternalLink, ImagePlus, Loader2, Lock, Trash2, X } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { HELP_NEEDS } from '@/lib/helpNeeds';
import { NeedIcon } from '@/components/needs/NeedIcon';
import { ProfileAvatar } from '@/components/profile/ProfileBits';
import { ImageCropDialog } from '@/components/profile/ImageCropDialog';
import {
  getMyProfile, getProfile, getSupported, LINKS, normalizeUsername, profileAction, profilePath, saveProfileImage, usernameAvailable,
  USERNAME_RE, type ImageKind, type MyProfile, type ProfileFundraiser,
} from '@/lib/profiles';

const MAX_UPLOAD = 15 * 1024 * 1024;
type Blocked = { username: string | null; display_name: string; avatar_url: string | null };

function Block({ id, title, description, children }: { id?: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border py-10 first:border-t-0 first:pt-0">
      <h2 className="font-display text-3xl font-normal text-foreground">{title}</h2>
      {description && <p className="mt-1 max-w-xl text-muted-foreground">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [me, setMe] = useState<MyProfile | null>(null);
  const [form, setForm] = useState({ display_name: '', bio: '', causes: [] as string[], links: {} as Record<string, string>, show_location: false, visibility: 'private' as 'private' | 'public', show_supported: true, pinned: [] as string[] });
  const [username, setUsername] = useState('');
  const [nameState, setNameState] = useState<'idle' | 'checking' | 'free' | 'taken' | 'invalid'>('idle');
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ file: File; kind: ImageKind } | null>(null);
  const [pinOptions, setPinOptions] = useState<ProfileFundraiser[]>([]);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const pickKind = useRef<ImageKind>('avatar');

  useEffect(() => { if (!loading && !user) navigate('/auth?next=%2Fprofile'); }, [user, loading, navigate]);

  const load = async () => {
    if (!user) return;
    const p = await getMyProfile(user.id).catch(() => null);
    if (!p) return;
    setMe(p);
    setForm({ display_name: p.display_name ?? '', bio: p.bio ?? '', causes: p.causes ?? [], links: p.links ?? {}, show_location: p.show_location, visibility: p.profile_visibility, show_supported: p.show_supported, pinned: p.pinned_fundraisers ?? [] });
    setUsername(p.username ?? '');
    setFullName(p.full_name ?? user.user_metadata?.full_name ?? '');
    const { data: b } = await supabase.rpc('my_blocked_people' as never);
    setBlocked((b as unknown as Blocked[]) ?? []);
    if (p.username) {
      const [mine, gave] = await Promise.all([getProfile(p.username).catch(() => null), getSupported(p.username, 0, 24).catch(() => null)]);
      const seen = new Set<string>();
      setPinOptions([...(mine?.organized ?? []), ...(gave?.rows ?? [])].filter((f) => !seen.has(f.id) && seen.add(f.id)));
    }
  };
  useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Username availability, checked as the person types.
  useEffect(() => {
    const u = normalizeUsername(username);
    if (!u || u === me?.username) { setNameState('idle'); return; }
    if (!USERNAME_RE.test(u) || /[._]{2}/.test(u)) { setNameState('invalid'); return; }
    setNameState('checking');
    const t = window.setTimeout(async () => setNameState((await usernameAvailable(u).catch(() => false)) ? 'free' : 'taken'), 350);
    return () => window.clearTimeout(t);
  }, [username, me?.username]);

  const restricted = me?.restrictions?.includes('profile');
  const dirty = useMemo(() => !!me && JSON.stringify(form) !== JSON.stringify({ display_name: me.display_name ?? '', bio: me.bio ?? '', causes: me.causes ?? [], links: me.links ?? {}, show_location: me.show_location, visibility: me.profile_visibility, show_supported: me.show_supported, pinned: me.pinned_fundraisers ?? [] }), [form, me]);

  const saveUsername = async () => {
    setSaving('username');
    const { data, error } = await profileAction<{ ok: true; username: string }>('username', { username });
    setSaving(null);
    if (error) { toast({ title: error, variant: 'destructive' }); return; }
    toast({ title: 'Username saved', description: `Your profile is at coupondonation.com/u/${data?.username}` });
    await load();
  };
  const saveProfile = async () => {
    setSaving('profile');
    const { error } = await profileAction('save', {
      display_name: form.display_name, bio: form.bio, causes: form.causes, links: form.links, show_location: form.show_location,
      visibility: form.visibility, show_supported: form.show_supported, pinned_fundraisers: form.pinned,
    });
    setSaving(null);
    if (error) { toast({ title: error, variant: 'destructive' }); return; }
    toast({ title: 'Profile saved' });
    await load();
  };
  const saveAccountName = async () => {
    if (!user) return;
    setSaving('account');
    const name = fullName.trim().slice(0, 120);
    const [{ error: a }, { error: b }] = await Promise.all([
      supabase.auth.updateUser({ data: { full_name: name } }),
      supabase.from('profiles').update({ full_name: name }).eq('user_id', user.id),
    ]);
    setSaving(null);
    toast(a || b ? { title: 'Could not save your name. Please try again.', variant: 'destructive' } : { title: 'Name saved' });
  };
  const pick = (kind: ImageKind) => { pickKind.current = kind; fileInput.current?.click(); };
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast({ title: 'Choose a JPG, PNG or WebP image.', variant: 'destructive' }); return; }
    if (file.size > MAX_UPLOAD) { toast({ title: 'That image is over 15 MB. Please choose a smaller one.', variant: 'destructive' }); return; }
    setCrop({ file, kind: pickKind.current });
  };
  const setImage = async (kind: ImageKind, blob: Blob | null) => {
    if (!user) return;
    setSaving(kind);
    const { error } = await saveProfileImage(user.id, kind, blob);
    setSaving(null);
    if (error) { toast({ title: error, variant: 'destructive' }); return; }
    setCrop(null);
    toast({ title: blob ? (kind === 'avatar' ? 'Photo saved' : 'Cover saved') : (kind === 'avatar' ? 'Photo removed' : 'Cover removed') });
    await load();
  };
  const unblock = async (u: string) => {
    const { error } = await profileAction('block', { username: u, block: false });
    if (error) { toast({ title: error, variant: 'destructive' }); return; }
    setBlocked((b) => b.filter((x) => x.username !== u));
  };
  const toggleCause = (id: string) => setForm((f) => ({ ...f, causes: f.causes.includes(id) ? f.causes.filter((c) => c !== id) : f.causes.length >= 5 ? f.causes : [...f.causes, id] }));
  const togglePin = (id: string) => setForm((f) => ({ ...f, pinned: f.pinned.includes(id) ? f.pinned.filter((c) => c !== id) : f.pinned.length >= 3 ? f.pinned : [...f.pinned, id] }));

  if (loading || !me) {
    return <div className="flex min-h-dvh items-center justify-center bg-background"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" aria-label="Loading" /></div>;
  }

  const shownName = form.display_name.trim() || fullName.trim() || 'Your name';
  const place = [me.city, me.country].filter(Boolean).join(', ');
  const nameHint = { idle: '', checking: 'Checking…', free: 'Available', taken: 'Taken. Try another.', invalid: '3 to 30 letters, numbers, dots or underscores. Start and end with a letter or number.' }[nameState];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SEO title="Your profile" description="Edit your CouponDonation profile." path="/profile" noindex />
      <Navbar />
      <main className="container mx-auto max-w-3xl flex-1 px-4 pb-32 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl font-normal text-foreground md:text-6xl">Your profile.</h1>
            <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
              {me.profile_visibility === 'public' ? 'Public: anyone can find and follow you.' : <><Lock className="h-4 w-4" aria-hidden="true" />Private: others see only your name, photo and cover.</>}
            </p>
          </div>
          {me.username && <Button asChild variant="outline" className="min-h-11 gap-1.5"><Link to={profilePath(me.username)}>View profile<ExternalLink className="h-4 w-4" aria-hidden="true" /></Link></Button>}
        </div>

        {restricted && <p className="mt-6 rounded-md bg-destructive/10 p-4 text-sm text-foreground">Profile changes are turned off for your account. Email support@coupondonation.com if you have questions.</p>}
        {me.profile_hidden && <p className="mt-6 rounded-md bg-destructive/10 p-4 text-sm text-foreground">Our safety team has hidden your profile, so only you can see it. Email support@coupondonation.com if you think this is a mistake.</p>}

        <fieldset disabled={!!restricted} className="mt-10">
          <Block title="Photo and cover" description="Your photo shows on your profile, your fundraisers and next to your name when you give.">
            <div className="relative">
              <div className="aspect-[3/1] overflow-hidden rounded-[1.25rem] bg-primary-20">
                {me.cover_url && <img src={me.cover_url} alt="Your cover image" className="h-full w-full object-cover" />}
              </div>
              <div className="absolute right-3 top-3 flex gap-2">
                <Button size="sm" variant="secondary" className="min-h-11 gap-1.5" onClick={() => pick('cover')} disabled={saving === 'cover'}><ImagePlus className="h-4 w-4" aria-hidden="true" />{me.cover_url ? 'Change cover' : 'Add cover'}</Button>
                {me.cover_url && <Button size="icon" variant="secondary" className="h-11 w-11" aria-label="Remove cover" onClick={() => setImage('cover', null)}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>}
              </div>
              <div className="-mt-12 flex items-end gap-3 px-5">
                <ProfileAvatar src={me.avatar_url} name={shownName} className="h-24 w-24 text-4xl ring-4 ring-background" />
                <div className="flex gap-2 pb-1">
                  <Button size="sm" variant="outline" className="min-h-11 gap-1.5" onClick={() => pick('avatar')} disabled={saving === 'avatar'}><ImagePlus className="h-4 w-4" aria-hidden="true" />{me.avatar_url ? 'Change photo' : 'Add photo'}</Button>
                  {me.avatar_url && <Button size="icon" variant="outline" className="h-11 w-11" aria-label="Remove photo" onClick={() => setImage('avatar', null)}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>}
                </div>
              </div>
            </div>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
          </Block>

          <Block title="Name and username" description="Your username is your profile’s address. You can change it any time; the old address stops working.">
            <div className="grid gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="display-name">Name on your profile</Label>
                <Input id="display-name" value={form.display_name} maxLength={60} placeholder={fullName || 'Your name'} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
                <p className="text-sm text-muted-foreground">Leave empty to use your first name and last initial.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <Input id="username" value={username} maxLength={31} autoCapitalize="none" autoCorrect="off" spellCheck={false} className="pl-7" aria-describedby="username-hint"
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} />
                  </div>
                  <Button className="min-h-11" onClick={saveUsername} disabled={nameState !== 'free' || saving === 'username'}>{saving === 'username' && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}Save username</Button>
                </div>
                <p id="username-hint" aria-live="polite" className={cn('flex items-center gap-1 text-sm', nameState === 'free' ? 'text-primary' : nameState === 'taken' || nameState === 'invalid' ? 'text-destructive' : 'text-muted-foreground')}>
                  {nameState === 'free' && <Check className="h-4 w-4" aria-hidden="true" />}{nameState === 'taken' && <X className="h-4 w-4" aria-hidden="true" />}
                  {nameHint || (me.username ? `coupondonation.com/u/${me.username}` : 'Choose a username to get a profile link.')}
                </p>
              </div>
            </div>
          </Block>

          <Block title="About you">
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={form.bio} maxLength={160} rows={3} placeholder="What do you care about?" onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              <p className="text-right text-sm text-muted-foreground">{[...form.bio].length}/160</p>
            </div>
            <fieldset className="mt-6">
              <legend className="text-sm font-medium text-foreground">Causes you care about <span className="font-normal text-muted-foreground">(up to 5)</span></legend>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {HELP_NEEDS.map((n) => {
                  const on = form.causes.includes(n.id);
                  return (
                    <button key={n.id} type="button" aria-pressed={on} onClick={() => toggleCause(n.id)} disabled={!on && form.causes.length >= 5}
                      className={cn('flex min-h-[52px] items-center gap-2.5 rounded-[14px] border px-3 text-left text-[15px] leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40',
                        on ? 'border-primary bg-[hsl(var(--primary-93))] font-semibold' : 'border-border bg-card font-medium hover:bg-[hsl(var(--primary-97))]')}>
                      <NeedIcon id={n.id} className="h-5 w-5 shrink-0 text-primary" />{n.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="mt-6 flex items-center justify-between gap-4 rounded-md bg-secondary p-4">
              <Label htmlFor="show-location" className="font-normal">Show my location{place ? <span className="block text-sm text-muted-foreground">{place}</span> : <span className="block text-sm text-muted-foreground">There’s no city on your account yet.</span>}</Label>
              <Switch id="show-location" checked={form.show_location} disabled={!place} onCheckedChange={(v) => setForm({ ...form, show_location: v })} />
            </div>
          </Block>

          <Block title="Links" description="Social profiles and a website people can visit. Payment app links aren’t allowed.">
            <div className="grid gap-4 sm:grid-cols-2">
              {LINKS.map((l) => (
                <div key={l.key} className="space-y-1.5">
                  <Label htmlFor={`link-${l.key}`}>{l.label}</Label>
                  <Input id={`link-${l.key}`} value={form.links[l.key] ?? ''} placeholder={l.placeholder} maxLength={200} autoCapitalize="none" spellCheck={false}
                    onChange={(e) => setForm({ ...form, links: { ...form.links, [l.key]: e.target.value } })} />
                </div>
              ))}
            </div>
          </Block>

          <Block id="privacy" title="Privacy" description="Profiles start private. Public profiles can be found in search and followed.">
            <RadioGroup value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v as 'private' | 'public' })} className="gap-3">
              {([
                ['private', 'Private', 'Others see only your name, photo and cover. You can’t be found in search.'],
                ['public', 'Public', 'Your bio, causes, links, fundraisers and followers are visible, and people can find you.'],
              ] as const).map(([v, t, d]) => (
                <Label key={v} className={cn('flex cursor-pointer gap-3 rounded-[14px] border p-4 font-normal', form.visibility === v ? 'border-primary bg-[hsl(var(--primary-97))]' : 'border-border')}>
                  <RadioGroupItem value={v} className="mt-1" disabled={v === 'public' && !me.username} />
                  <span><span className="block font-semibold text-foreground">{t}</span><span className="block text-sm text-muted-foreground">{v === 'public' && !me.username ? 'Choose a username first.' : d}</span></span>
                </Label>
              ))}
            </RadioGroup>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-md bg-secondary p-4">
              <Label htmlFor="show-supported" className="font-normal">Show the fundraisers I support<span className="block text-sm text-muted-foreground">Only gifts you didn’t make anonymously. Amounts are never shown.</span></Label>
              <Switch id="show-supported" checked={form.show_supported} onCheckedChange={(v) => setForm({ ...form, show_supported: v })} />
            </div>
          </Block>

          {pinOptions.length > 0 && (
            <Block title="Pinned fundraisers" description="Pin up to 3 fundraisers you run or support to the top of your profile.">
              <ul className="grid gap-2">
                {pinOptions.map((f) => {
                  const on = form.pinned.includes(f.id);
                  return (
                    <li key={f.id}>
                      <button type="button" aria-pressed={on} onClick={() => togglePin(f.id)} disabled={!on && form.pinned.length >= 3}
                        className={cn('flex min-h-11 w-full items-center justify-between gap-3 rounded-[14px] border px-4 py-3 text-left disabled:opacity-40', on ? 'border-primary bg-[hsl(var(--primary-97))]' : 'border-border hover:bg-secondary')}>
                        <span className="font-medium text-foreground">{f.title}</span>{on && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Block>
          )}
        </fieldset>

        <Block title="Account" description="Your full name stays private. Fundraisers show your first name and last initial unless you choose otherwise.">
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="full-name">Full name</Label>
              <div className="flex gap-2"><Input id="full-name" value={fullName} maxLength={120} onChange={(e) => setFullName(e.target.value)} /><Button variant="outline" className="min-h-11" onClick={saveAccountName} disabled={saving === 'account'}>Save</Button></div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={me.email} disabled className="bg-muted" />
              <p className="text-sm text-muted-foreground">To change your email, write to support@coupondonation.com.</p>
            </div>
          </div>
        </Block>

        {blocked.length > 0 && (
          <Block title="Blocked people" description="They can’t see your profile, follow you or message you.">
            <ul className="divide-y divide-border">
              {blocked.map((b) => (
                <li key={b.username ?? b.display_name} className="flex items-center justify-between gap-3 py-3">
                  <span className="flex items-center gap-3"><ProfileAvatar src={b.avatar_url} name={b.display_name} className="h-10 w-10 text-lg" /><span className="font-medium">{b.display_name}{b.username && <span className="block text-sm font-normal text-muted-foreground">@{b.username}</span>}</span></span>
                  {b.username && <Button variant="outline" size="sm" className="min-h-11" onClick={() => unblock(b.username!)}>Unblock</Button>}
                </li>
              ))}
            </ul>
          </Block>
        )}
      </main>

      {dirty && !restricted && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
          <div className="container mx-auto flex max-w-3xl items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">You have unsaved changes.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="min-h-11" onClick={() => load()}>Discard</Button>
              <Button className="min-h-11" onClick={saveProfile} disabled={saving === 'profile'}>{saving === 'profile' && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}Save profile</Button>
            </div>
          </div>
        </div>
      )}
      <Footer contact={false} />
      <ImageCropDialog file={crop?.file ?? null} kind={crop?.kind ?? 'avatar'} onCancel={() => setCrop(null)} onDone={(blob) => setImage(crop!.kind, blob)} />
    </div>
  );
}
