import { Bullets, LegalPage, SupportEmail, type LegalSection } from '@/components/legal/LegalPage';
import { LEGAL_PHONE } from '@/lib/legal';

const sections: LegalSection[] = [
  {
    id: 'goal',
    title: 'Our goal',
    body: <p>We want everyone to be able to give and ask for help on CouponDonation. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA, and we test with keyboards and screen readers as we build.</p>,
  },
  {
    id: 'features',
    title: 'What the site does to help',
    body: <Bullets items={[
      <>Pause animations: the button at the bottom left of the homepage scene, and the link at the bottom of every page, stop moving content. The site remembers your choice.</>,
      <>We build pages to work with a keyboard, with a visible focus outline.</>,
      <>Form fields have labels, and forms tell you in words what's missing before you continue.</>,
      <>Buttons and links are sized for touch on phones.</>,
    ]} />,
  },
  {
    id: 'limits',
    title: 'Known limitations',
    body: <Bullets items={[
      <>The 3D tree on the homepage is decorative. You can pause it, and you don't need it to donate or apply.</>,
      <>Photos and videos that people upload to fundraisers may not have descriptions or captions.</>,
      <>Some pages may not yet fully meet WCAG 2.1 AA. We fix problems as we find them or as you report them.</>,
    ]} />,
  },
  {
    id: 'help',
    title: 'Getting help',
    body: <p>If anything on CouponDonation is hard to use, email <SupportEmail /> or call {LEGAL_PHONE}. Tell us the page and what happened. We'll reply within 5 business days and can help you donate or apply another way in the meantime.</p>,
  },
];

export default function Accessibility() {
  return (
    <LegalPage
      title="Accessibility"
      path="/accessibility"
      description="CouponDonation's accessibility commitment, features such as pausing animations, known limitations, and how to get help."
      intro={<p>CouponDonation should work for everyone, including people who use assistive technology.</p>}
      sections={sections}
    />
  );
}
