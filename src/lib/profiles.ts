import { supabase } from '@/integrations/supabase/client';
import { callFn } from '@/lib/serverActions';

/**
 * Public profiles (founder request, Oct 2026; GoFundMe-style). Private by default: a private profile
 * shows only name, photo and cover. Reads go through security-definer RPCs; every write goes through
 * the profile-actions edge function, which moderates text and rate-limits.
 */

export interface ProfileFundraiser {
  id: string; title: string; unique_slug: string | null; category: string; city: string | null; state_code: string | null;
  cover_photo_url: string | null; fundraiser_images: Array<{ id: string; image_url: string; is_primary: boolean | null; display_order: number }>;
}

export interface PublicProfile {
  username: string; display_name: string; avatar_url: string | null; cover_url: string | null;
  visibility: 'private' | 'public'; hidden: boolean; is_self: boolean; signed_in: boolean;
  is_following: boolean; follow_notify: boolean | null;
  bio?: string | null; causes?: string[]; links?: Record<string, string>; location?: string | null; joined?: string;
  followers_count?: number; following_count?: number; show_supported?: boolean; supported_count?: number | null;
  organized?: ProfileFundraiser[]; pinned?: ProfileFundraiser[];
}

export interface PersonRow {
  username: string | null; display_name: string; avatar_url: string | null; visibility: 'private' | 'public';
  bio: string | null; is_self: boolean; is_following: boolean;
}

export interface FeedItem { kind: 'fundraiser' | 'supported'; at: string; actor: PersonRow; fundraiser: ProfileFundraiser }
export interface ProfileNotice { id: string; kind: 'follow'; at: string; read: boolean; actor: PersonRow }
export interface Paged<T> { rows: T[]; total: number }

const rpc = async <T,>(fn: string, args: Record<string, unknown> = {}) => {
  const { data, error } = await supabase.rpc(fn as never, args as never);
  if (error) throw error;
  return data as unknown as T;
};

export const getProfile = (username: string) => rpc<PublicProfile | null>('get_profile', { _username: username });
export const getSupported = (username: string, offset = 0, limit = 12) =>
  rpc<Paged<ProfileFundraiser>>('get_profile_supported', { _username: username, _limit: limit, _offset: offset });
export const getFollowList = (username: string, which: 'followers' | 'following', offset = 0, limit = 30) =>
  rpc<Paged<PersonRow>>('get_follow_list', { _username: username, _which: which, _limit: limit, _offset: offset });
export const searchPeople = (q: string, offset = 0, limit = 20) => rpc<Paged<PersonRow>>('search_people', { _q: q, _limit: limit, _offset: offset });
export const suggestedPeople = (limit = 8) => rpc<PersonRow[]>('suggested_people', { _limit: limit });
export const followingFeed = (offset = 0, limit = 20) => rpc<FeedItem[]>('following_feed', { _limit: limit, _offset: offset });
export const myProfileNotices = (limit = 20) => rpc<ProfileNotice[]>('my_profile_notifications', { _limit: limit });
export const markNoticesRead = () => rpc<void>('mark_profile_notifications_read');
export const usernameAvailable = (username: string) => rpc<boolean>('username_available', { _username: username });

export interface MyProfile {
  user_id: string; email: string; full_name: string | null; username: string | null; display_name: string | null; bio: string | null;
  avatar_url: string | null; cover_url: string | null; causes: string[]; links: Record<string, string>; show_location: boolean;
  profile_visibility: 'private' | 'public'; show_supported: boolean; pinned_fundraisers: string[]; city: string | null; country: string | null;
  profile_hidden: boolean; restrictions: string[];
}

export async function getMyProfile(uid: string): Promise<MyProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle();
  if (error) throw error;
  return data as unknown as MyProfile | null;
}

export const profileAction = <T = { ok: true }>(action: string, body: Record<string, unknown> = {}) =>
  callFn<T>('profile-actions', { action, ...body });

export const USERNAME_RE = /^[a-z0-9][a-z0-9_.]{1,28}[a-z0-9]$/;
export const normalizeUsername = (s: string) => s.trim().replace(/^@/, '').toLowerCase();

export const LINKS: Array<{ key: string; label: string; placeholder: string; url: (h: string) => string }> = [
  { key: 'website', label: 'Website', placeholder: 'yourwebsite.org', url: (h) => h },
  { key: 'instagram', label: 'Instagram', placeholder: 'username', url: (h) => `https://instagram.com/${h}` },
  { key: 'facebook', label: 'Facebook', placeholder: 'username', url: (h) => `https://facebook.com/${h}` },
  { key: 'tiktok', label: 'TikTok', placeholder: 'username', url: (h) => `https://tiktok.com/@${h}` },
  { key: 'x', label: 'X', placeholder: 'username', url: (h) => `https://x.com/${h}` },
  { key: 'youtube', label: 'YouTube', placeholder: 'channel', url: (h) => `https://youtube.com/@${h}` },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'profile name', url: (h) => `https://linkedin.com/in/${h}` },
];

export const profilePath = (username: string) => `/u/${username}`;
export const profileUrl = (username: string) => `https://coupondonation.com/u/${username}`;

export const IMAGE_SPECS = {
  avatar: { width: 480, height: 480, label: 'profile photo' },
  cover: { width: 1500, height: 500, label: 'cover image' },
} as const;
export type ImageKind = keyof typeof IMAGE_SPECS;
export const PROFILE_BUCKET = 'fundraiser-covers';

/** Uploads a cropped image (already a WebP blob) to the person's own folder, then saves it on the profile. */
export async function saveProfileImage(uid: string, kind: ImageKind, blob: Blob | null) {
  if (!blob) return profileAction<{ ok: true; url: null }>('image', { kind, path: null });
  const id = crypto.getRandomValues(new Uint32Array(3)).reduce((s, n) => s + n.toString(36), '').slice(0, 16).padEnd(8, '0');
  // Profile photos sit in the person's own folder of the public fundraiser-covers bucket (the workspace
  // doesn't allow new public buckets); the file name marks them as profile images.
  const path = `${uid}/profile-${kind}-${id}.webp`;
  const { error } = await supabase.storage.from(PROFILE_BUCKET).upload(path, blob, { contentType: 'image/webp', upsert: false });
  if (error) return { error: 'Could not upload the image. Please try a smaller JPG, PNG or WebP.' };
  return profileAction<{ ok: true; url: string }>('image', { kind, path });
}

export const REPORT_REASONS = ['Impersonation', 'Scam or fraud', 'Harassment or hate', 'Inappropriate photo', 'Spam', 'Other'];

const MONTH = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
export const joinedLabel = (iso?: string) => (iso ? `Joined ${MONTH.format(new Date(iso))}` : '');
export const initialOf = (name: string) => (name.trim()[0] ?? 'C').toUpperCase();
