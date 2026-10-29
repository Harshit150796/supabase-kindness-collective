import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BellOff, Check, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { signInPath } from '@/lib/serverActions';
import { toast } from '@/hooks/use-toast';
import { initialOf, profileAction, profilePath, type PersonRow, type ProfileFundraiser } from '@/lib/profiles';
import { FundraiserImageFallback, resolveFundraiserImage, transformedFundraiserImage } from '@/lib/fundraiserImages';
import { cityState } from '@/lib/helpNeeds';

/** A round photo, or the first letter of the name on logo green when there is no photo. */
export function ProfileAvatar({ src, name, className }: { src: string | null | undefined; name: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  return src && !broken
    ? <img src={src} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} className={cn('aspect-square shrink-0 rounded-full bg-secondary object-cover', className)} />
    : <span aria-hidden="true" className={cn('flex aspect-square shrink-0 items-center justify-center rounded-full bg-primary font-display text-primary-foreground', className)}>{initialOf(name)}</span>;
}

export function FollowButton({ username, following, signedIn, onChange, className, size = 'default' }: {
  username: string; following: boolean; signedIn: boolean; onChange: (following: boolean) => void; className?: string; size?: 'default' | 'sm';
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    if (!signedIn) { navigate(signInPath(pathname)); return; }
    setBusy(true);
    const { error } = await profileAction('follow', { username, follow: !following });
    setBusy(false);
    if (error) { toast({ title: error, variant: 'destructive' }); return; }
    onChange(!following);
  };
  return (
    <Button type="button" size={size} variant={following ? 'outline' : 'default'} onClick={toggle} disabled={busy} aria-pressed={following}
      className={cn('min-h-11 gap-1.5', className)}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : following ? <Check className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}

export function NotifyToggle({ username, notify, onChange }: { username: string; notify: boolean; onChange: (n: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const flip = async () => {
    setBusy(true);
    const { error } = await profileAction('notify', { username, notify: !notify });
    setBusy(false);
    if (error) { toast({ title: error, variant: 'destructive' }); return; }
    onChange(!notify);
  };
  return (
    <Button type="button" variant="outline" size="icon" className="h-11 w-11" onClick={flip} disabled={busy}
      aria-label={notify ? 'Stop updates from this person in your feed' : 'Show updates from this person in your feed'} aria-pressed={notify}>
      {notify ? <Bell className="h-4 w-4" aria-hidden="true" /> : <BellOff className="h-4 w-4" aria-hidden="true" />}
    </Button>
  );
}

/** One person in a list: photo, name, @username, a line of bio, and Follow. */
export function PersonRowView({ person, signedIn, onFollow }: { person: PersonRow; signedIn: boolean; onFollow?: (following: boolean) => void }) {
  const [following, setFollowing] = useState(person.is_following);
  const inner = (
    <>
      <ProfileAvatar src={person.avatar_url} name={person.display_name} className="h-12 w-12 text-xl" />
      <span className="min-w-0">
        <span className="block truncate font-medium text-foreground">{person.display_name}</span>
        {person.username && <span className="block truncate text-sm text-muted-foreground">@{person.username}</span>}
        {person.bio && <span className="mt-0.5 line-clamp-1 block text-sm text-muted-foreground">{person.bio}</span>}
      </span>
    </>
  );
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      {person.username
        ? <Link to={profilePath(person.username)} className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{inner}</Link>
        : <span className="flex min-w-0 items-center gap-3">{inner}</span>}
      {person.username && !person.is_self && (
        <FollowButton size="sm" username={person.username} following={following} signedIn={signedIn}
          onChange={(f) => { setFollowing(f); onFollow?.(f); }} className="shrink-0" />
      )}
    </li>
  );
}

/** A fundraiser on a profile: photo, title and place, linking to its page. */
export function ProfileFundraiserCard({ fundraiser }: { fundraiser: ProfileFundraiser }) {
  const img = transformedFundraiserImage(resolveFundraiserImage(fundraiser), 640);
  const place = cityState(fundraiser.city, fundraiser.state_code);
  const href = fundraiser.unique_slug ? `/f/${fundraiser.unique_slug}` : `/story/${fundraiser.id}`;
  return (
    <Link to={href} className="group block rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <span className="block aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-secondary">
        {img
          ? <img src={img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          : <FundraiserImageFallback category={fundraiser.category} />}
      </span>
      <span className="mt-3 block font-display text-2xl leading-tight text-foreground">{fundraiser.title}</span>
      {place && <span className="mt-1 block text-sm text-muted-foreground">{place}</span>}
    </Link>
  );
}
