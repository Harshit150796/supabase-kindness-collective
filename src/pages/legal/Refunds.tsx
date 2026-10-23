import { Bullets, DocLink, LegalPage, SupportEmail, type LegalSection } from '@/components/legal/LegalPage';

const sections: LegalSection[] = [
  {
    id: 'always',
    title: 'When we always refund',
    body: <Bullets items={[
      <>You were charged twice for the same gift.</>,
      <>Someone used your card without your permission.</>,
      <>A technical fault charged the wrong amount.</>,
    ]} />,
  },
  {
    id: 'mistakes',
    title: 'If you change your mind',
    body: <p>Email us within 7 days of your gift. If our team hasn't yet bought coupons with it, we'll refund the gift, your tip and any card fee you covered. Once coupons have been bought and given to the recipient, the gift can't be refunded, because the coupons can't be returned.</p>,
  },
  {
    id: 'removed',
    title: 'If we remove a fundraiser',
    body: <p>If we remove a fundraiser for breaking our <DocLink to="/terms">Terms of Use</DocLink> or <DocLink to="/fundraiser-rules">Fundraiser Rules</DocLink>, we refund gifts to it that haven't been turned into coupons yet.</p>,
  },
  {
    id: 'not',
    title: 'When we can\'t refund',
    body: <Bullets items={[
      <>Gifts that have already been turned into coupons.</>,
      <>Gifts to a fundraiser that didn't reach its goal, which still reach the recipient.</>,
      <>Monthly charges made before you cancelled.</>,
    ]} />,
  },
  {
    id: 'monthly',
    title: 'Monthly gifts',
    body: <p>You can cancel a monthly gift at any time from your dashboard or from the link in Square's monthly receipt. No further charges are made after you cancel.</p>,
  },
  {
    id: 'how',
    title: 'How to ask',
    body: <p>Email <SupportEmail /> with the email address you gave, the date and the amount. We'll reply within 5 business days. Refunds go back to the card you used and usually appear within 5 to 10 business days, depending on your bank. If you're unhappy with our answer, please contact us before disputing the charge with your bank, so we can try to fix it.</p>,
  },
];

export default function Refunds() {
  return (
    <LegalPage
      title="Refund Policy"
      path="/refunds"
      description="When CouponDonation refunds a donation, how to ask, and how monthly gifts are cancelled."
      intro={<p>Gifts on CouponDonation become store coupons for a real person, so most can't be undone once coupons are bought. Here is exactly when we refund.</p>}
      sections={sections}
    />
  );
}
