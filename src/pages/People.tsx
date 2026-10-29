import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { signInPath } from '@/lib/serverActions';
import {
  followingFeed, markNoticesRead, myProfileNotices, profilePath, searchPeople, suggestedPeople,
  type FeedItem, type PersonRow, type ProfileNotice,
} from '@/lib/profiles';
import { PersonRowView, ProfileAvatar, ProfileFundraiserCard } from '@/components/profile/ProfileBits';

const AGO = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
/** "3 hours ago", "yesterday": each unit is used until the next one is reached. */
const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [['year', 31557600], ['month', 2629800], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
function ago(iso: string) {
  const s = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) if (Math.abs(s) >= size) return AGO.format(Math.round(s / size), unit);
  return 'just now';
}

function PeopleList({ rows, signedIn, empty }: { rows: PersonRow[] | null; signedIn: boolean; empty: string }) {
  if (rows === null) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" /></div>;
  if (!rows.length) return <p className="py-6 text-muted-foreground">{empty}</p>;
  return <ul className="divide-y divide-border">{rows.map((p, i) => <PersonRowView key={`${p.username}-${i}`} person={p} signedIn={signedIn} />)}</ul>;
}

function FeedEntry({ item }: { item: FeedItem }) {
  const who = item.actor;
  return (
    <li className="grid gap-4 py-8 md:grid-cols-[1fr_280px] md:items-start">
      <div className="flex items-start gap-3">
        <ProfileAvatar src={who.avatar_url} name={who.display_name} className="h-11 w-11 text-lg" />
        <p className="pt-1.5 text-foreground">
          {who.username ? <Link to={profilePath(who.username)} className="font-semibold underline-offset-4 hover:underline">{who.display_name}</Link> : <span className="font-semibold">{who.display_name}</span>}
          {item.kind === 'fundraiser' ? ' started a fundraiser' : ' supported a fundraiser'}
          <span className="block text-sm text-muted-foreground">{ago(item.at)}</span>
        </p>
      </div>
      <ProfileFundraiserCard fundraiser={item.fundraiser} />
    </li>
  );
}

export default function People() {
  const { user } = useAuth();
  const signedIn = !!user;
  const [q, setQ] = useState('');
  const [results, setResults] = useState<PersonRow[] | null>(null);
  const [suggested, setSuggested] = useState<PersonRow[] | null>(null);
  const [feed, setFeed] = useState<FeedItem[] | null>(null);
  const [feedDone, setFeedDone] = useState(false);
  const [notices, setNotices] = useState<ProfileNotice[]>([]);
  const [tab, setTab] = useState(signedIn ? 'feed' : 'discover');

  useEffect(() => { setTab(signedIn ? 'feed' : 'discover'); }, [signedIn]);
  useEffect(() => { suggestedPeople(12).then(setSuggested).catch(() => setSuggested([])); }, [user]);
  useEffect(() => {
    if (!signedIn) { setFeed([]); setNotices([]); return; }
    followingFeed(0, 20).then((f) => { setFeed(f); setFeedDone(f.length < 20); }).catch(() => setFeed([]));
    myProfileNotices(20).then((n) => { setNotices(n); if (n.some((x) => !x.read)) markNoticesRead().catch(() => undefined); }).catch(() => setNotices([]));
  }, [signedIn]);
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults(null); return; }
    setResults(null);
    const t = window.setTimeout(() => searchPeople(term, 0, 30).then((r) => setResults(r.rows)).catch(() => setResults([])), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  const moreFeed = async () => {
    if (!feed) return;
    const next = await followingFeed(feed.length, 20).catch(() => []);
    setFeed([...feed, ...next]);
    setFeedDone(next.length < 20);
  };
  const searching = q.trim().length >= 2;
  const newFollowers = notices.filter((n) => !n.read);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SEO title="Find people" description="Find people who give and raise on CouponDonation, and follow what they support." path="/people" noindex />
      <Navbar />
      <main className="container mx-auto max-w-4xl flex-1 px-4 pb-20 pt-8">
        <h1 className="font-display text-5xl font-normal text-foreground md:text-7xl">Find people.</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">Follow people who give and raise on CouponDonation to see the fundraisers they start and support.</p>

        <div className="relative mt-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or @username" aria-label="Search people" className="h-14 rounded-[14px] pl-12 text-base" />
        </div>

        {searching ? (
          <section className="mt-6" aria-live="polite">
            <PeopleList rows={results} signedIn={signedIn} empty="No public profiles match. Private profiles don’t show in search." />
          </section>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="mt-8">
            <TabsList className="h-auto">
              {signedIn && <TabsTrigger value="feed" className="min-h-11 px-4">Following</TabsTrigger>}
              <TabsTrigger value="discover" className="min-h-11 px-4">People to follow</TabsTrigger>
              {signedIn && <TabsTrigger value="activity" className="min-h-11 px-4">New followers{newFollowers.length > 0 && <span className="ml-2 rounded-full bg-primary px-2 text-xs text-primary-foreground">{newFollowers.length}</span>}</TabsTrigger>}
            </TabsList>

            {signedIn && (
              <TabsContent value="feed">
                {feed === null ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" /></div>
                  : feed.length === 0 ? (
                    <div className="py-8">
                      <p className="text-muted-foreground">When people you follow start or support a fundraiser, it shows here.</p>
                      <Button className="mt-4 min-h-11" onClick={() => setTab('discover')}>Find people to follow</Button>
                    </div>
                  ) : (
                    <>
                      <ul className="divide-y divide-border">{feed.map((item, i) => <FeedEntry key={`${item.kind}-${item.fundraiser.id}-${i}`} item={item} />)}</ul>
                      {!feedDone && <Button variant="outline" className="mt-4 min-h-11" onClick={moreFeed}>Show more</Button>}
                    </>
                  )}
              </TabsContent>
            )}

            <TabsContent value="discover">
              <PeopleList rows={suggested} signedIn={signedIn} empty="No public profiles yet. Make yours public from Your profile so others can find you." />
              {!signedIn && <p className="mt-6 text-muted-foreground"><Link to={signInPath('/people')} className="font-medium text-primary underline-offset-4 hover:underline">Sign in</Link> to follow people and see suggestions based on what you support.</p>}
            </TabsContent>

            {signedIn && (
              <TabsContent value="activity">
                {notices.length === 0 ? <p className="py-6 text-muted-foreground">No new followers yet.</p> : (
                  <ul className="divide-y divide-border">
                    {notices.map((n) => (
                      <li key={n.id} className="flex items-center gap-3 py-3">
                        <ProfileAvatar src={n.actor.avatar_url} name={n.actor.display_name} className="h-10 w-10 text-lg" />
                        <p className="text-foreground">
                          {n.actor.username ? <Link to={profilePath(n.actor.username)} className="font-semibold underline-offset-4 hover:underline">{n.actor.display_name}</Link> : <span className="font-semibold">{n.actor.display_name}</span>} started following you
                          <span className="block text-sm text-muted-foreground">{ago(n.at)}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>
      <Footer contact={false} />
    </div>
  );
}
