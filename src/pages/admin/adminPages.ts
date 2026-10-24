import { lazy } from 'react';

/** Every admin page's code loader, keyed by its path, so the portal can fetch them ahead of a click. */
export const ADMIN_LOADERS: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  '/admin': () => import('./AdminDashboard'),
  '/admin/analytics': () => import('./AdminAnalytics'),
  '/admin/fundraisers': () => import('./AdminFundraisers'),
  '/admin/donations': () => import('./AdminDonations'),
  '/admin/donors': () => import('./AdminDonors'),
  '/admin/monthly': () => import('./AdminMonthly'),
  '/admin/verifications': () => import('./AdminVerifications'),
  '/admin/coupons': () => import('./AdminCoupons'),
  '/admin/card-donations': () => import('./AdminCardDonations'),
  '/admin/procurement': () => import('./AdminProcurement'),
  '/admin/gold-coins': () => import('./AdminGoldCoins'),
  '/admin/partners': () => import('./AdminPartners'),
  '/admin/moderation': () => import('./AdminModeration'),
  '/admin/contact': () => import('./AdminContactMessages'),
  '/admin/followups': () => import('./AdminFollowups'),
  '/admin/tasks': () => import('./AdminTasks'),
  '/admin/notifications': () => import('./AdminNotifications'),
  '/admin/content': () => import('./AdminContent'),
  '/admin/stories': () => import('./AdminStories'),
  '/admin/testimonials': () => import('./AdminTestimonials'),
  '/admin/blog': () => import('./AdminBlog'),
  '/admin/faq': () => import('./AdminFAQ'),
  '/admin/newsletters': () => import('./AdminNewsletters'),
  '/admin/team': () => import('./AdminTeam'),
  '/admin/users': () => import('./AdminUsers'),
  '/admin/audit': () => import('./AdminAudit'),
  '/admin/settings': () => import('./AdminSettings'),
};

const started = new Set<string>();
/** Starts downloading an admin page's code once; safe to call on every hover. */
export function prefetchAdminPage(path: string) {
  const load = ADMIN_LOADERS[path];
  if (!load || started.has(path)) return;
  started.add(path);
  load().catch(() => started.delete(path));
}

export const adminPage = (path: string) => lazy(ADMIN_LOADERS[path]);
