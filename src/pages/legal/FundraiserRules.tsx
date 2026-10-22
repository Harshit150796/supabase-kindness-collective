import { Bullets, DocLink, LegalPage, SupportEmail, type LegalSection } from '@/components/legal/LegalPage';

const sections: LegalSection[] = [
  {
    id: 'who',
    title: 'Who can start a fundraiser',
    body: <Bullets items={[
      <>Adults 18 or older who live in the United States.</>,
      <>For yourself, for your household, or, as a community group, for people you support who have agreed to it.</>,
      <>A child can be the beneficiary only when their parent or guardian organizes the fundraiser or agrees to it.</>,
    ]} />,
  },
  {
    id: 'allowed',
    title: 'What fundraisers can be for',
    body: <p>Everyday essentials that store coupons can cover: groceries, meals, pharmacy items, baby and children's needs, clothing, school supplies, getting around, household basics and help after an emergency.</p>,
  },
  {
    id: 'not-allowed',
    title: 'What isn\'t allowed',
    body: <Bullets items={[
      <>Anything untrue or misleading, including made-up people, stories or photos, or other people's stories copied from elsewhere.</>,
      <>More than one active fundraiser for the same need.</>,
      <>Raising money for a business, investment, debt, legal case, political campaign or anything illegal.</>,
      <>Selling, trading or swapping coupons for cash.</>,
      <>Hateful, violent, sexual or harassing content.</>,
      <>Photos of people who haven't agreed, or private details such as ID numbers, bank details, home addresses or medical records.</>,
      <>Phone numbers, emails, payment links or requests to give outside CouponDonation.</>,
    ]} />,
  },
  {
    id: 'review',
    title: 'How we review',
    body: <p>Your page goes live when you submit it. Our team may review it at any time and may ask for more information, such as proof of identity or eligibility. We pause or remove fundraisers that break these rules and may close the account. Gifts not yet turned into coupons may be refunded under our <DocLink to="/refunds">Refund Policy</DocLink>.</p>,
  },
  {
    id: 'report',
    title: 'Reporting a fundraiser',
    body: <p>Use Report fundraiser at the bottom of any fundraiser page, or email <SupportEmail />. We review every report.</p>,
  },
];

export default function FundraiserRules() {
  return (
    <LegalPage
      title="Fundraiser Rules"
      path="/fundraiser-rules"
      description="Who can start a fundraiser on CouponDonation, what it can be for, what isn't allowed, and how we review and handle reports."
      intro={<p>These rules keep CouponDonation honest for donors and safe for the people asking for help. They're part of our <DocLink to="/terms">Terms of Use</DocLink>.</p>}
      sections={sections}
    />
  );
}
