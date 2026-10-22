import { Bullets, LegalPage, SupportEmail, type LegalSection } from '@/components/legal/LegalPage';
import { COMPANY, MAILING_ADDRESS } from '@/lib/legal';

const sections: LegalSection[] = [
  {
    id: 'notice',
    title: 'Reporting copyright infringement',
    body: <>
      <p>If you believe something on CouponDonation, such as a photo or story, infringes your copyright, send a notice to our copyright agent with:</p>
      <Bullets items={[
        <>your physical or electronic signature;</>,
        <>the work you say has been copied;</>,
        <>the link to the material on CouponDonation;</>,
        <>your name, address, phone number and email address;</>,
        <>a statement that you believe in good faith the use isn't authorized by the owner, its agent or the law;</>,
        <>a statement, under penalty of perjury, that your notice is accurate and that you are the owner or authorized to act for the owner.</>,
      ]} />
    </>,
  },
  {
    id: 'agent',
    title: 'Our copyright agent',
    body: <p>Copyright Agent, {COMPANY}<br />Email: <SupportEmail /> (subject line: Copyright notice){MAILING_ADDRESS && <><br />Mail: {MAILING_ADDRESS}</>}</p>,
  },
  {
    id: 'counter',
    title: 'If your content was removed',
    body: <p>If we removed your content and you believe it was a mistake or that you have the right to use it, you can send a counter-notice to the same address with your signature, the material removed and where it appeared, a statement under penalty of perjury that you believe it was removed by mistake, and your name, address and phone number, with your consent to the jurisdiction of the federal court for your address. We may restore the content after 10 business days unless the person who complained tells us they've gone to court.</p>,
  },
  {
    id: 'repeat',
    title: 'Repeat infringers',
    body: <p>We close the accounts of people who repeatedly infringe others' copyright.</p>,
  },
  {
    id: 'other',
    title: 'Privacy and other complaints',
    body: <p>If a fundraiser shows you, your child or your private information without permission, email <SupportEmail /> and we'll review it quickly, whether or not copyright is involved.</p>,
  },
];

export default function Copyright() {
  return (
    <LegalPage
      title="Copyright Policy"
      path="/copyright"
      description="How to report copyright infringement on CouponDonation, our copyright agent, and counter-notices."
      intro={<p>We respect creators' rights and respond to valid notices under the US Digital Millennium Copyright Act.</p>}
      sections={sections}
    />
  );
}
