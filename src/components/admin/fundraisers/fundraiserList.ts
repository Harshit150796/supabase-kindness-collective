/** Admin > Fundraisers (founder request, Nov 12, 2026): one row of admin_fundraiser_list. */
export type FundraiserRow = {
  id: string;
  title: string;
  unique_slug: string | null;
  status: string;
  category: string;
  help_categories: string[];
  preferred_brands: string[];
  city: string | null;
  state_code: string | null;
  beneficiary_type: string | null;
  monthly_goal: number;
  created_at: string | null;
  updated_at: string | null;
  is_example: boolean;
  featured_order: number | null;
  photo_url: string | null;
  photo_count: number;
  story_length: number;
  organizer_id: string | null;
  organizer_name: string | null;
  organizer_email: string | null;
  organizer_phone: string | null;
  raised: number;
  gifts: number;
  last_gift_at: string | null;
  coupons_waiting: number;
  coupons_ready: number;
  coupons_used: number;
  open_reports: number;
  homepage_position: number | null;
  homepage_hidden: boolean;
  homepage_pinned: boolean;
  total_count: number;
};

export type FundraiserCounts = {
  total: number;
  status: Record<string, number>;
  views: Record<string, number>;
  raised: number;
  waiting: number;
};

export const STATUSES = ['all', 'pending', 'active', 'paused', 'completed', 'rejected', 'archived'] as const;
export const STATUS_LABEL: Record<string, string> = {
  all: 'All', pending: 'Waiting for review', active: 'Active', paused: 'Paused', completed: 'Completed', rejected: 'Rejected', archived: 'Archived',
};

/** Quick views: the server applies the same rules (_admin_fundraiser_in_view). */
export const ATTENTION_VIEWS = [
  { id: 'review', label: 'Waiting for review', hint: 'New fundraisers to approve or reject' },
  { id: 'coupons', label: 'Coupons to send', hint: 'Gifts whose coupons the team still has to buy and send' },
  { id: 'reports', label: 'Open reports', hint: 'Someone reported the page, an update or a comment' },
  { id: 'no_photo', label: 'No photo', hint: 'Open fundraisers without a photo' },
  { id: 'short_story', label: 'Short story', hint: 'Open fundraisers with a story under 200 characters' },
  { id: 'no_gifts', label: 'No gifts yet', hint: 'Active fundraisers nobody has given to yet' },
] as const;
export const FIND_VIEWS = [
  { id: 'close', label: 'Close to goal', hint: 'Active and at 75% or more of the goal' },
  { id: 'funded', label: 'Reached goal', hint: 'Raised the whole goal or more' },
  { id: 'homepage', label: 'On the homepage lineup', hint: 'Placed in Admin > Homepage' },
  { id: 'hidden', label: 'Hidden from homepage', hint: 'Hidden in Admin > Homepage' },
  { id: 'examples', label: 'Examples', hint: 'Showcase campaigns (no real gifts)' },
  { id: 'real', label: 'Real only', hint: 'Leave the example campaigns out' },
] as const;
export const VIEW_LABEL: Record<string, string> = Object.fromEntries([...ATTENTION_VIEWS, ...FIND_VIEWS].map((v) => [v.id, v.label]));

export const SORTS = [
  { id: 'created:desc', label: 'Newest first' },
  { id: 'created:asc', label: 'Oldest first' },
  { id: 'updated:desc', label: 'Recently edited' },
  { id: 'last_gift:desc', label: 'Latest gift' },
  { id: 'raised:desc', label: 'Most raised' },
  { id: 'progress:desc', label: 'Closest to goal' },
  { id: 'progress:asc', label: 'Furthest from goal' },
  { id: 'gifts:desc', label: 'Most gifts' },
  { id: 'waiting:desc', label: 'Most coupons to send' },
  { id: 'goal:desc', label: 'Biggest goal' },
  { id: 'title:asc', label: 'Title A to Z' },
  { id: 'organizer:asc', label: 'Organizer A to Z' },
] as const;

export const PAGE_SIZE = 24;

export const progressOf = (row: Pick<FundraiserRow, 'raised' | 'monthly_goal'>) =>
  row.monthly_goal > 0 ? Math.max(0, Math.min(1, Number(row.raised) / Number(row.monthly_goal))) : 0;

const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });
export const percent = (n: number) => percentFormatter.format(n);

const wholeUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const usdWhole = (n: number | null | undefined) => wholeUsd.format(Number(n ?? 0));

const relative = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto', style: 'short' });
/** "3 days ago", "in 2 hr": short relative time for list rows. */
export function ago(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return null;
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return 'just now';
  if (abs < 3600) return relative.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), 'hour');
  if (abs < 86400 * 30) return relative.format(Math.round(seconds / 86400), 'day');
  if (abs < 86400 * 365) return relative.format(Math.round(seconds / (86400 * 30)), 'month');
  return relative.format(Math.round(seconds / (86400 * 365)), 'year');
}

/** What a page needs before it goes live; shown in the drawer and as hints in the list. */
export function pageChecks(f: {
  photo_count: number; story_length: number; help_categories: string[]; category?: string | null; preferred_brands: string[];
  city: string | null; state_code: string | null; monthly_goal: number; organizer_email: string | null; organizer_phone?: string | null;
}): Array<{ id: string; label: string; ok: boolean; optional?: boolean }> {
  return [
    { id: 'photo', label: f.photo_count ? `${f.photo_count} photo${f.photo_count === 1 ? '' : 's'}` : 'No photo yet', ok: f.photo_count > 0 },
    { id: 'story', label: f.story_length >= 200 ? `Story of ${f.story_length} characters` : `Story is short (${f.story_length} characters, 200 or more reads better)`, ok: f.story_length >= 200 },
    { id: 'needs', label: (f.help_categories.length || f.category) ? 'Needs chosen' : 'No needs chosen', ok: !!(f.help_categories.length || f.category) },
    { id: 'stores', label: f.preferred_brands.length ? `${f.preferred_brands.length} store${f.preferred_brands.length === 1 ? '' : 's'} requested` : 'No stores requested', ok: f.preferred_brands.length > 0 },
    { id: 'place', label: f.city || f.state_code ? 'City and state set' : 'No city or state', ok: !!(f.city || f.state_code) },
    { id: 'goal', label: f.monthly_goal > 0 ? 'Goal set' : 'No goal', ok: f.monthly_goal > 0 },
    { id: 'email', label: f.organizer_email ? 'Organizer has an email on file' : 'No organizer email on file', ok: !!f.organizer_email },
    // Optional for organizers, so a missing number is a note, not a problem.
    { id: 'phone', label: f.organizer_phone ? 'Organizer has a phone number on file' : 'No phone number (optional)', ok: !!f.organizer_phone, optional: true },
  ];
}
