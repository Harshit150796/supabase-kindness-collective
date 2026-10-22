import { Bullets, DocLink, LegalPage, SupportEmail, type LegalSection } from '@/components/legal/LegalPage';

const sections: LegalSection[] = [
  {
    id: 'what',
    title: 'Health data we collect',
    body: <>
      <p>We collect consumer health data only when you give it to us while asking for help:</p>
      <Bullets items={[
        <>needs you select that relate to health, such as Health & pharmacy or Baby & kids;</>,
        <>health details you choose to write in your story or show in photos, such as an illness, injury, pregnancy, disability or medication;</>,
        <>pharmacy stores you choose, such as CVS or Walgreens;</>,
        <>the kind of program you qualify under if you go through eligibility review, which can include disability.</>,
      ]} />
      <p>We don't collect health data from donors, buy it, or infer it from your browsing.</p>
    </>,
  },
  {
    id: 'why',
    title: 'Why we collect it',
    body: <p>To publish your fundraiser so donors understand your need, to buy coupons for the stores you chose, to review requests for fraud and safety, and to answer you. We don't use it for advertising.</p>,
  },
  {
    id: 'share',
    title: 'Who we share it with',
    body: <>
      <p>Your fundraiser is public, so health details you put in it are visible to anyone who views it. You choose this, and confirm it, when you submit your request. Beyond that, we share health data only with the service providers that store, host and email for us under contract (Supabase, Lovable and Resend), with the AI service behind the Coupon assistant if you type health details into it, and with authorities when the law requires it.</p>
      <p>We never sell consumer health data.</p>
    </>,
  },
  {
    id: 'consent',
    title: 'Your consent',
    body: <p>When you submit a request, you confirm you have permission to share everything in it and agree that we publish it. You can withdraw that consent at any time by editing or removing details from your fundraiser, or by asking us to remove it.</p>,
  },
  {
    id: 'rights',
    title: 'Your rights',
    body: <>
      <p>You can ask us to:</p>
      <Bullets items={[
        <>confirm whether we hold your consumer health data, show it to you and list the companies we've shared it with;</>,
        <>delete it, including from our service providers;</>,
        <>stop using it, by withdrawing your consent.</>,
      ]} />
      <p>Email <SupportEmail /> from the address on your account. We'll reply within 45 days. If we refuse, you can appeal by replying to our answer; we'll respond within 45 days and tell you how to contact your state attorney general if you disagree.</p>
    </>,
  },
  {
    id: 'more',
    title: 'More information',
    body: <p>This policy adds to our <DocLink to="/privacy">Privacy Policy</DocLink> and is written for laws such as Washington's My Health My Data Act and Nevada's consumer health data law.</p>,
  },
];

export default function HealthDataPrivacy() {
  return (
    <LegalPage
      title="Consumer Health Data Privacy Policy"
      path="/health-data-privacy"
      description="How CouponDonation collects, uses and shares health information people include in requests for help, and your rights."
      intro={<p>Some people asking for help share health information. This policy explains what we collect, why, who sees it, and your rights.</p>}
      sections={sections}
    />
  );
}
