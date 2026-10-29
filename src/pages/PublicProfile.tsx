import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Globe, Loader2, Lock, MapPin, MoreHorizontal, Pencil, Share2 } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { NeedIcon } from '@/components/needs/NeedIcon';
import { needLabel } from '@/lib/helpNeeds';
import { safeHref } from '@/lib/safeUrl';
import { getProfile, getSupported, joinedLabel, LINKS, profileAction, profileUrl, type ProfileFundraiser, type PublicProfile as Profile } from '@/lib/profiles';
import { FollowButton, NotifyToggle, ProfileAvatar, ProfileFundraiserCard } from '@/components/profile/ProfileBits';
import { FollowListDialog, ReportProfileDialog } from '@/components/profile/ProfileDialogs';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="font-display text-4xl font-normal text-foreground">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

const Grid = ({ items }: { items: ProfileFundraiser[] }) => (
  <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{items.map((f) => <ProfileFundraiserCard key={f.id} fundraiser={f} />)}</div>
);

export default function PublicProfile() {
  const { username = '' } = useParams();
  const [p, setP] = useState<Profile | null | undefined>(undefined);
  const [supported, setSupported] = useState<{ rows: ProfileFundraiser[]; total: number } | null>(null);
  const [list, setList] = useState<'followers' | 'following' | null>(null);
  const [reporting, setReporting] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const prof = await getProfile(username);
      setP(prof);
      if (prof && (prof.visibility === 'public' || prof.is_self) && (prof.show_supported || prof.is_self)) {
        setSupported(await getSupported(username));
      } else setSupported(null);
    } catch { setP(null); }
  }, [username]);
  useEffect(() => { setP(undefined); load(); }, [load]);

  const share = async () => {
    const url = profileUrl(username);
    try {
      if (navigator.share) await navigator.share({ title: p?.display_name, url });
      else { await navigator.clipboard.writeText(url); toast({ title: 'Profile link copied' }); }
    } catch { /* dismissed */ }
  };
  const block = async () => {
    setMoreBusy(true);
    const { error } = await profileAction('block', { username, block: true });
    setMoreBusy(false);
    if (error) { toast({ title: error, variant: 'destructive' }); return; }
    toast({ title: `You blocked @${username}`, description: 'You won’t see each other’s profiles, and neither of you can follow or message the other.' });
    setP(null);
  };
  const moreSupported = async () => {
    if (!supported) return;
    const r = await getSupported(username, supported.rows.length);
    setSupported({ rows: [...supported.rows, ...r.rows], total: r.total });
  };

  if (p === undefined) {
    return <div className="flex min-h-dvh flex-col bg-background"><Navbar /><main className="flex flex-1 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" aria-label="Loading profile" /></main></div>;
  }
  if (p === null) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <SEO title="Profile not found" description="This profile isn’t available." path={`/u/${username}`} noindex />
        <Navbar />
        <main className="container mx-auto flex-1 px-4 py-20">
          <h1 className="font-display text-5xl font-normal text-foreground">This profile isn’t available.</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">The username may have changed, or the profile was removed. You can look for people by name instead.</p>
          <Button asChild className="mt-6 min-h-11"><Link to="/people">Find people</Link></Button>
        </main>
        <Footer contact={false} />
      </div>
    );
  }

  const full = p.visibility === 'public' || p.is_self;
  const links = LINKS.filter((l) => p.links?.[l.key]).map((l) => ({ ...l, href: safeHref(l.url(p.links![l.key])) })).filter((l) => l.href);
  const organized = p.organized ?? [];
  const pinned = p.pinned ?? [];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SEO title={`${p.display_name} (@${p.username})`} description={p.bio || `${p.display_name} on CouponDonation.`} path={`/u/${p.username}`} noindex />
      <Navbar />
      <main className="container mx-auto max-w-6xl flex-1 px-4 pb-20 pt-4 md:pt-8">
        <div className="aspect-[5/2] overflow-hidden rounded-[1.5rem] bg-primary-20 md:aspect-[3/1]">
          {p.cover_url && <img src={p.cover_url} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
        </div>

        <div className="flex flex-col gap-5 px-1 md:flex-row md:items-end md:justify-between md:px-6">
          <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-end">
            <ProfileAvatar src={p.avatar_url} name={p.display_name} className="-mt-14 h-28 w-28 text-5xl ring-4 ring-background md:-mt-20 md:h-40 md:w-40 md:text-6xl" />
            <div className="min-w-0 md:pb-2">
              <h1 className="break-words font-display text-5xl font-normal leading-none text-foreground md:text-6xl">{p.display_name}</h1>
              <p className="mt-2 text-muted-foreground">@{p.username}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:pb-3">
            {p.is_self ? (
              <>
                <Button asChild className="min-h-11 gap-1.5"><Link to="/profile"><Pencil className="h-4 w-4" aria-hidden="true" />Edit profile</Link></Button>
                <Button variant="outline" className="min-h-11 gap-1.5" onClick={share}><Share2 className="h-4 w-4" aria-hidden="true" />Share</Button>
              </>
            ) : (
              <>
                <FollowButton username={p.username} following={p.is_following} signedIn={p.signed_in}
                  onChange={(f) => setP({ ...p, is_following: f, follow_notify: f ? true : null, followers_count: (p.followers_count ?? 0) + (f ? 1 : -1) })} />
                {p.is_following && <NotifyToggle username={p.username} notify={p.follow_notify !== false} onChange={(n) => setP({ ...p, follow_notify: n })} />}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11" aria-label="More options" disabled={moreBusy}><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={share}>Share profile</DropdownMenuItem>
                    {p.signed_in && <DropdownMenuItem onSelect={() => setReporting(true)}>Report</DropdownMenuItem>}
                    {p.signed_in && <DropdownMenuItem onSelect={() => setConfirmBlock(true)} className="text-destructive focus:text-destructive">Block @{p.username}</DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 max-w-3xl px-1 md:px-6">
          {p.is_self && p.hidden && (
            <p className="mb-5 rounded-md bg-destructive/10 p-4 text-sm text-foreground">Our safety team has hidden your profile, so only you can see it. Email support@coupondonation.com if you think this is a mistake.</p>
          )}
          {p.is_self && p.visibility === 'private' && !p.hidden && (
            <p className="mb-5 flex gap-2 rounded-md bg-secondary p-4 text-sm text-foreground"><Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>Your profile is private: others see only your name, photo and cover. <Link to="/profile#privacy" className="font-medium text-primary underline-offset-4 hover:underline">Make it public</Link> to share your bio, causes and fundraisers.</span></p>
          )}
          {full ? (
            <>
              {p.bio && <p className="text-xl leading-relaxed text-foreground">{p.bio}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {p.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden="true" />{p.location}</span>}
                {p.joined && <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" aria-hidden="true" />{joinedLabel(p.joined)}</span>}
                {links.map((l) => (
                  <a key={l.key} href={l.href!} target="_blank" rel="noopener noreferrer nofollow ugc" className="flex min-h-11 items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline">
                    {l.key === 'website' && <Globe className="h-4 w-4" aria-hidden="true" />}{l.key === 'website' ? new URL(l.href!).hostname.replace(/^www\./, '') : l.label}
                  </a>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
                <button type="button" onClick={() => setList('followers')} className="min-h-11 text-left text-foreground underline-offset-4 hover:underline"><strong className="font-semibold">{p.followers_count ?? 0}</strong> {p.followers_count === 1 ? 'follower' : 'followers'}</button>
                <button type="button" onClick={() => setList('following')} className="min-h-11 text-left text-foreground underline-offset-4 hover:underline"><strong className="font-semibold">{p.following_count ?? 0}</strong> following</button>
                {p.supported_count != null && p.supported_count > 0 && <span className="flex min-h-11 items-center text-foreground">Supported <strong className="mx-1 font-semibold">{p.supported_count}</strong> {p.supported_count === 1 ? 'fundraiser' : 'fundraisers'}</span>}
              </div>
              {!!p.causes?.length && (
                <ul className="mt-5 flex flex-wrap gap-2" aria-label="Causes they care about">
                  {p.causes.map((c) => (
                    <li key={c} className="flex items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-sm font-medium text-foreground"><NeedIcon id={c} className="h-4 w-4 text-primary" />{needLabel(c)}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="flex items-center gap-2 text-lg text-muted-foreground"><Lock className="h-4 w-4" aria-hidden="true" />This profile is private.</p>
          )}
        </div>

        {full && (
          <div className="px-1 md:px-6">
            {pinned.length > 0 && <Section title="Pinned"><Grid items={pinned} /></Section>}
            {organized.length > 0 && <Section title="Fundraisers"><Grid items={organized} /></Section>}
            {supported && supported.rows.length > 0 && (
              <Section title="Supported">
                <Grid items={supported.rows} />
                {supported.rows.length < supported.total && <Button variant="outline" className="mt-8 min-h-11" onClick={moreSupported}>Show more</Button>}
              </Section>
            )}
            {p.is_self && !organized.length && !(supported?.rows.length) && (
              <Section title="Nothing here yet">
                <p className="max-w-xl text-muted-foreground">Fundraisers you start, and the ones you support without staying anonymous, show here once your profile is public.</p>
                <div className="mt-5 flex flex-wrap gap-2"><Button asChild className="min-h-11"><Link to="/stories">Find a fundraiser</Link></Button><Button asChild variant="outline" className="min-h-11"><Link to="/people">Find people</Link></Button></div>
              </Section>
            )}
          </div>
        )}
      </main>
      <Footer contact={false} />

      {list && <FollowListDialog username={p.username} which={list} open={!!list} onOpenChange={(o) => !o && setList(null)} signedIn={p.signed_in} />}
      <ReportProfileDialog username={p.username} open={reporting} onOpenChange={setReporting} />
      <AlertDialog open={confirmBlock} onOpenChange={setConfirmBlock}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block @{p.username}?</AlertDialogTitle>
            <AlertDialogDescription>You’ll stop following each other, and neither of you will see the other’s profile or be able to send messages. They aren’t told. You can unblock from Settings in Your profile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={block} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Block</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
