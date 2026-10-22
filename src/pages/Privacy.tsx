import { Bullets, DocLink, LegalPage, SupportEmail, type LegalSection } from '@/components/legal/LegalPage';
import { COMPANY, COMPANY_FORM } from '@/lib/legal';

const sections: LegalSection[] = [
  {
    id: 'who',
    title: 'Who we are',
    body: <p>{COMPANY}, {COMPANY_FORM}, runs coupondonation.com. We decide how the personal information described here is used. CouponDonation is offered to people in the United States.</p>,
  },
  {
    id: 'collect',
    title: 'What we collect',
    body: <>
      <p><strong>If you donate:</strong> your name, email address, gift amounts, the fundraiser and stores you chose, any message you add, your tip and whether you covered the card fee. Square collects your card details on its own page; we only receive the card brand and last four digits, and for saved cards, a reference Square gives us.</p>
      <p><strong>If you ask for help:</strong> your name, email address, who the request is for, the needs and stores you choose, your story, photos and videos, your goal, your ZIP code and the city and state it belongs to. If you go through eligibility review, we also keep the kind of program you qualify under (for example income-based, disability, senior, student or veteran) and our notes. If you upload purchase receipts, we keep the copy after you've covered private details.</p>
      <p><strong>If you have an account:</strong> your sign-in details (we store passwords only in hashed form), phone number if you add it, settings, messages, comments, updates, Gold Coins and loyalty records, and a record of which version of our Terms you accepted and when.</p>
      <p><strong>When you visit:</strong> your IP address and the approximate location it shows (used to keep out sanctioned regions and to limit abuse), device and browser details, and pages visited. With your OK on the cookie bar, we also use analytics (see section 6). Drafts of an application are saved in your own browser until you submit them.</p>
      <p><strong>When you contact us or use the Coupon assistant:</strong> what you write to us, and your conversation with the assistant.</p>
      <p><strong>From emails we send:</strong> whether an email was opened and which links were clicked, so we can tell whether impact updates arrive.</p>
    </>,
  },
  {
    id: 'public',
    title: 'What other people can see',
    body: <>
      <p>Fundraisers are public. Anyone can see a fundraiser's title, story, photos and videos, city and state, needs and requested stores, the organizer's first name and last initial, totals, updates, comments, and the names donors chose to show with their gifts.</p>
      <p>Your ZIP code, email address, phone number and payment details are never shown on a public page. Recipients never see donors' email addresses or contact details, and the public never sees individual purchases.</p>
      <p>Stories often describe health, money or family difficulties. Only share what you're comfortable making public, and never include ID numbers, bank details or someone else's private information.</p>
    </>,
  },
  {
    id: 'use',
    title: 'How we use it',
    body: <Bullets items={[
      <>To run the Service: create accounts, publish fundraisers, process gifts, buy and deliver coupons, and send receipts and updates.</>,
      <>To keep it safe: review fundraisers, prevent fraud and abuse, check messages before delivery, block sanctioned regions, and secure accounts.</>,
      <>To answer you, and to improve the Service using analytics you allowed.</>,
      <>To send news and updates you signed up for. Every one has an unsubscribe link.</>,
      <>To meet legal duties, such as keeping payment records, answering lawful requests and enforcing our <DocLink to="/terms">Terms of Use</DocLink>.</>,
    ]} />,
  },
  {
    id: 'share',
    title: 'Who we share it with',
    body: <>
      <p>We don't sell personal information, and we don't share it for targeted advertising. We share it only with:</p>
      <Bullets items={[
        <><strong>Service providers</strong> that run parts of CouponDonation for us under contract: Supabase (database, sign-in and file storage), Lovable (website hosting), Square (payments), Resend (email delivery), PostHog (analytics, only after you allow it), Google (only if you use Google sign-in), the AI service that powers the Coupon assistant, and Zippopotam.us, which looks up the city for a ZIP code you type.</>,
        <><strong>Stores and gift card sellers</strong>, only what's needed to buy coupons. We don't send them recipients' stories.</>,
        <><strong>Donors and recipients</strong>, as described in section 3, and purchase receipts with private details covered, shared with the donors whose gift paid for them.</>,
        <><strong>Authorities</strong>, when the law requires it, or to protect people from harm or fraud.</>,
        <><strong>A buyer</strong> of CouponDonation's business, if that happens, under this policy.</>,
      ]} />
    </>,
  },
  {
    id: 'cookies',
    title: 'Cookies and analytics',
    body: <p>We use essential cookies and browser storage to keep you signed in and remember your choices. Analytics (PostHog) runs only after you select Okay on the cookie bar, never records what you type into forms, and stays off when your browser sends a Global Privacy Control or Do Not Track signal. You can change your choice at any time with Cookie settings at the bottom of every page. Our <DocLink to="/cookies">Cookie Policy</DocLink> lists what we store.</p>,
  },
  {
    id: 'keep',
    title: 'How long we keep it',
    body: <Bullets items={[
      <>Account details: while your account is open, then deleted within 30 days of a deletion request.</>,
      <>Fundraisers: while live, and afterwards so donors can check where their gift went, unless you ask us to remove one.</>,
      <>Donation, payment and coupon records: as long as tax, accounting and anti-fraud rules require, usually seven years.</>,
      <>Security logs and request limits: usually no more than a few months; request-limit records are cleared after a day.</>,
      <>Application drafts in your browser: until you submit, sign out or clear your browser.</>,
    ]} />,
  },
  {
    id: 'choices',
    title: 'Your choices and rights',
    body: <>
      <p>Wherever you live in the US, you can ask us to:</p>
      <Bullets items={[
        <>show you the personal information we hold about you, or send you a copy;</>,
        <>correct it;</>,
        <>delete it, apart from records the law requires us to keep;</>,
        <>stop sending you news (use the unsubscribe link in any email).</>,
      ]} />
      <p>Use the buttons in Settings, or email <SupportEmail /> from the address on your account. We'll confirm it's you, reply within 45 days, and won't treat you differently for asking. You can also ask someone to act for you with your written permission. If we refuse a request, you can appeal by replying to our answer, and we'll respond within 45 days. If your state gives you more rights, we honor them.</p>
    </>,
  },
  {
    id: 'health',
    title: 'Health information',
    body: <p>Some requests include health details, such as a need for pharmacy items or a story about an illness. Our <DocLink to="/health-data-privacy">Consumer Health Data Privacy Policy</DocLink> explains how we collect, use and share that information and the rights you have under laws such as Washington's My Health My Data Act.</p>,
  },
  {
    id: 'children',
    title: 'Children',
    body: <p>CouponDonation is for adults 18 and older, and we don't knowingly collect personal information from children under 13. A child can be the beneficiary of a fundraiser only with a parent's or guardian's permission. If you think a child has given us information, email <SupportEmail /> and we'll delete it.</p>,
  },
  {
    id: 'security',
    title: 'How we protect it',
    body: <p>Every connection to CouponDonation is encrypted. Our database rules limit each person to their own records, coupon codes can be revealed only by their owner or through a logged staff action, and card numbers never reach our systems. Sign-up forms have request limits to stop abuse. No system is perfectly secure; if a breach affects your information, we'll tell you and the authorities as the law requires.</p>,
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: <p>When we change this policy, we update the date at the top. For important changes, we'll tell you by email or on the site before they take effect.</p>,
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      path="/privacy"
      description="What CouponDonation collects, what's public on a fundraiser, who we share data with, and how to see, correct or delete yours."
      intro={<p>This policy explains what personal information CouponDonation collects, what other people can see, who we share it with and the choices you have. We don't sell your information.</p>}
      sections={sections}
    />
  );
}
