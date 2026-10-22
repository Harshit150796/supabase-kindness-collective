import { Bullets, DocLink, LegalPage, type LegalSection } from '@/components/legal/LegalPage';

const sections: LegalSection[] = [
  {
    id: 'what',
    title: 'What we store',
    body: <p>Cookies are small files a website saves in your browser. We also use your browser's local and session storage, which work the same way. We keep this to what the site needs, plus analytics only if you allow it.</p>,
  },
  {
    id: 'essential',
    title: 'Essential storage (always on)',
    body: <>
      <p>The site can't work properly without these, so they don't need your consent.</p>
      <Bullets items={[
        <><strong>Sign-in session</strong> (Supabase): keeps you signed in. Removed when you sign out.</>,
        <><strong>Session timer</strong> (session_start_time): signs you out after a long idle period.</>,
        <><strong>Your cookie choice</strong> (cd_privacy_consent): remembers whether you chose Okay or Essential only.</>,
        <><strong>Pause animations</strong> (cd_motion_paused): remembers if you paused moving content.</>,
        <><strong>Application drafts</strong> (recipient_application_data): saves a request you haven't submitted yet, on your device only. Cleared when you submit or sign out.</>,
        <><strong>Agreement record</strong> (cd_pending_agreement): holds, for a few minutes during sign-in, which Terms you agreed to so we can record it.</>,
        <><strong>Country check</strong> (geo_country): remembers which country you're visiting from, so the check isn't repeated.</>,
        <><strong>ZIP code cache</strong> (ziploc:…): remembers the city for ZIP codes you've typed so they aren't looked up again.</>,
        <><strong>Assistant history</strong> (coupon-chat-history): keeps your conversation with the Coupon assistant on your device.</>,
        <><strong>Device reference</strong> (anon_device_id): keeps a signed-out draft separate from other people on a shared device, for the browser session only.</>,
      ]} />
    </>,
  },
  {
    id: 'analytics',
    title: 'Analytics (only with your OK)',
    body: <p>If you select Okay on the cookie bar, we load PostHog, which sets its own cookies (named ph_…) to count visits and clicks so we can improve the site. It never records what you type into forms, doesn't record sessions, and stays off if your browser sends a Global Privacy Control or Do Not Track signal. If you choose Essential only, PostHog never loads; if you change your mind later, it stops right away.</p>,
  },
  {
    id: 'third-party',
    title: 'Other companies',
    body: <Bullets items={[
      <><strong>Square</strong> sets its own cookies on its checkout page when you donate, to process the payment and prevent fraud.</>,
      <><strong>Google</strong> sets its own cookies if you use Continue with Google.</>,
    ]} />,
  },
  {
    id: 'choices',
    title: 'Your choices',
    body: <p>Change your choice at any time with Cookie settings at the bottom of every page. You can also delete or block cookies in your browser settings; if you block essential storage, you won't be able to sign in or donate. Our <DocLink to="/privacy">Privacy Policy</DocLink> explains how we use the information.</p>,
  },
];

export default function Cookies() {
  return (
    <LegalPage
      title="Cookie Policy"
      path="/cookies"
      description="Which cookies and browser storage CouponDonation uses, why, and how to change your choice."
      intro={<p>This page lists everything CouponDonation stores in your browser and why. Analytics runs only if you allow it.</p>}
      sections={sections}
    />
  );
}
