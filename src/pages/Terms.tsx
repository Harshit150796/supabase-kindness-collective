import { Bullets, DocLink, LegalPage, SupportEmail, type LegalSection } from '@/components/legal/LegalPage';
import { COMPANY } from '@/lib/legal';

const sections: LegalSection[] = [
  {
    id: 'agreement',
    title: 'Agreeing to these Terms',
    body: <>
      <p>These Terms of Use are an agreement between you and {COMPANY} ("CouponDonation", "we", "us"). They apply when you visit coupondonation.com, create an account, sign in, donate, start or manage a fundraiser, send a message or use the Coupon assistant (together, the "Service").</p>
      <p>You agree to these Terms when you select a button that says so, such as Create account, Sign in, Continue with Google, Submit request or Donate. If you don't agree, please don't use the Service. Our <DocLink to="/privacy">Privacy Policy</DocLink>, <DocLink to="/refunds">Refund Policy</DocLink>, <DocLink to="/fundraiser-rules">Fundraiser Rules</DocLink> and <DocLink to="/copyright">Copyright Policy</DocLink> are part of these Terms.</p>
      <p><strong>Please read <a href="#disputes" className="font-medium text-primary underline underline-offset-2">Resolving disputes</a>.</strong> It says that most disputes are resolved by individual arbitration rather than in court, and that you give up the right to bring or join a class action. You can opt out within 30 days.</p>
    </>,
  },
  {
    id: 'service',
    title: 'What CouponDonation does',
    body: <>
      <p>People in the United States who need help with essentials post a fundraiser that says what they need and which stores would help most. Donors give money to a fundraiser and choose the stores their gift can be used at.</p>
      <p>After a gift is completed, our team uses it to buy store coupons, gift cards or similar store credit (together, "coupons") for the stores the donor chose, and adds them to the recipient's CouponDonation wallet. Coupons are issued by hand, so timing varies; they are not issued instantly. We decide the denominations of the coupons we buy. We never pay gifts out as cash.</p>
      <p>Each gift gets a receipt. Fundraiser pages show totals from completed donations, totals by store and how much has been used. Individual purchases are never shown publicly.</p>
    </>,
  },
  {
    id: 'what-we-are-not',
    title: 'What we are not',
    body: <Bullets items={[
      <>We are a company, not a registered charity or 501(c)(3) organization. Gifts through CouponDonation are not tax-deductible, and we don't issue tax receipts.</>,
      <>We are not a bank, a payment processor or a financial adviser. Payments are processed by Square.</>,
      <>We review fundraisers, but we can't confirm everything a fundraiser says, and we don't guarantee that a fundraiser will reach its goal, that coupons will be used exactly as described, or that any person or need is as described. Give to people and causes you trust.</>,
      <>Stores named on the Service are not our partners unless we say so in writing. Their names and logos are their trademarks, and they don't sponsor or endorse CouponDonation.</>,
    ]} />,
  },
  {
    id: 'eligibility',
    title: 'Who can use CouponDonation',
    body: <Bullets items={[
      <>You must be at least 18 years old and able to form a binding contract.</>,
      <>Recipients and fundraiser organizers must live in the United States. The Service is offered for use in the United States.</>,
      <>You may not use the Service if you are on a US government sanctions list, or from Cuba, Iran, North Korea, Syria, or the Crimea, Donetsk or Luhansk regions. We may block access from those places.</>,
      <>A child can be the beneficiary of a fundraiser only when their parent or legal guardian organizes it or gives permission.</>,
    ]} />,
  },
  {
    id: 'accounts',
    title: 'Your account',
    body: <Bullets items={[
      <>Give accurate information and keep it up to date. One person per account.</>,
      <>Keep your password private. You're responsible for what happens in your account. Tell us right away at <SupportEmail /> if you think someone else has used it.</>,
      <>We may pause or close an account that breaks these Terms, puts others at risk, or that we're required to close by law.</>,
    ]} />,
  },
  {
    id: 'fundraisers',
    title: 'Fundraisers',
    body: <>
      <p>If you start or manage a fundraiser, you agree that:</p>
      <Bullets items={[
        <>Everything you say in it is true and not misleading, and you'll update it if something important changes.</>,
        <>You have permission from every person shown or named in it, and from a parent or guardian for any child.</>,
        <>You'll use the coupons you receive for the needs your fundraiser describes, and you won't sell, trade or swap them for cash.</>,
        <>You'll follow the <DocLink to="/fundraiser-rules">Fundraiser Rules</DocLink>.</>,
      ]} />
      <p>Your fundraiser page goes live when you submit it. We may review it at any time, ask for more information such as proof of identity, edit how it's displayed, pause it, or remove it. If we remove a fundraiser because it breaks these Terms, we may refund gifts that haven't yet been turned into coupons, and we may decline to issue further coupons.</p>
    </>,
  },
  {
    id: 'donations',
    title: 'Donations',
    body: <Bullets items={[
      <>A donation is a gift to the fundraiser you chose, delivered as coupons for the stores you chose. You choose whole-dollar amounts of at least $10 for each store. The total is shown before you pay.</>,
      <>100% of your gift goes to the recipient as coupons; we take no platform fee from it. You can add an optional tip, which pays for running CouponDonation, and choose to cover the card processing fee. If you don't cover the fee, we pay it.</>,
      <>Payments are processed by Square on Square's own page and are also subject to Square's terms. We don't see or store your full card number.</>,
      <>If you choose a monthly gift, we charge the same amount each month until you cancel. You can cancel at any time from your dashboard or from Square's monthly receipt, and no further charges are made after you cancel.</>,
      <>Refunds are covered by our <DocLink to="/refunds">Refund Policy</DocLink>.</>,
      <>Donations to a fundraiser are not refundable just because a fundraiser didn't reach its goal.</>,
    ]} />,
  },
  {
    id: 'coupons',
    title: 'Coupons and gift cards',
    body: <Bullets items={[
      <>Coupons are issued by the stores that sell them and are subject to each store's own terms, including any expiry dates and limits.</>,
      <>Coupons have no cash value, can't be exchanged for cash, and can't be sold or traded.</>,
      <>Keep your codes private. We can't always replace coupons that are lost, stolen or used by someone else.</>,
      <>If a store becomes unavailable, we may issue coupons for a similar store when the recipient has said other stores are welcome, or contact the donor.</>,
    ]} />,
  },
  {
    id: 'rewards',
    title: 'Gold Coins and loyalty rewards',
    body: <p>Gold Coins, badges and loyalty card rewards have no cash value, can't be sold or transferred, and aren't property. We may change, pause or end these programs at any time.</p>,
  },
  {
    id: 'content',
    title: 'Your content',
    body: <>
      <p>You keep ownership of the words, photos and videos you post ("your content"). You give us a non-exclusive, royalty-free, worldwide license to host, store, display, copy, resize and share your content to run the Service and to share or promote your fundraiser, for as long as it's on the Service and for a reasonable time afterwards while it's removed from backups and from places we shared it. We don't use your content to train AI models.</p>
      <p>You promise you have the rights and permissions needed for your content, and that it doesn't break any law or anyone's rights. You can ask us to remove your content at any time by writing to <SupportEmail />.</p>
    </>,
  },
  {
    id: 'conduct',
    title: 'Things you may not do',
    body: <Bullets items={[
      <>Lie about who you are or what you need, or raise money for anything other than what the fundraiser describes.</>,
      <>Harass, threaten or exploit anyone, or post hateful, violent, sexual or illegal content.</>,
      <>Share contact details or payment requests in messages and comments. Messages are checked before they're delivered and may be blocked.</>,
      <>Post other people's private information or photos without permission.</>,
      <>Use bots or scrapers, probe or break our security, overload the Service, or get around any limit or block.</>,
      <>Use the Service to launder money, evade sanctions or commit fraud.</>,
    ]} />,
  },
  {
    id: 'copyright',
    title: 'Copyright',
    body: <p>We respond to notices of copyright infringement as described in our <DocLink to="/copyright">Copyright Policy</DocLink>, and we close the accounts of repeat infringers.</p>,
  },
  {
    id: 'assistant',
    title: 'The Coupon assistant',
    body: <p>Coupon, the assistant on our homepage, writes answers with artificial intelligence. Answers can be wrong or out of date; these Terms and our policies are what count. Don't share passwords, card numbers or other sensitive information with it.</p>,
  },
  {
    id: 'third-parties',
    title: 'Other services',
    body: <p>The Service uses and links to other companies' services, including Square for payments and Google for Google sign-in. Their own terms and privacy policies apply to what you do with them, and we aren't responsible for them.</p>,
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    body: <p>The Service is provided "as is" and "as available". To the fullest extent the law allows, we disclaim all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose and non-infringement. We don't promise the Service will be uninterrupted, error-free or secure, or that any fundraiser, recipient or store will act as described.</p>,
  },
  {
    id: 'liability',
    title: 'Limits on our liability',
    body: <>
      <p>To the fullest extent the law allows, CouponDonation and its officers, employees and agents are not liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, data or goodwill, arising from the Service.</p>
      <p>Our total liability for any claim about the Service is limited to the greater of $100 or the tips and fees you paid us in the 12 months before the claim. Some places don't allow these limits, so they may not all apply to you.</p>
      <p>You agree to cover our reasonable losses and costs, including legal fees, from claims by others that arise from your content, your fundraiser or your breaking these Terms.</p>
    </>,
  },
  {
    id: 'disputes',
    title: 'Resolving disputes',
    body: <>
      <p><strong>Talk to us first.</strong> Before starting a formal case, email <SupportEmail /> with your name, how to reach you, what happened and what you're asking for. We'll try in good faith to resolve it within 30 days.</p>
      <p><strong>Arbitration.</strong> If we can't resolve it, you and CouponDonation agree that any dispute about the Service or these Terms will be decided by binding individual arbitration administered by the American Arbitration Association under its Consumer Arbitration Rules, not in court. The Federal Arbitration Act governs this section. Either of us may instead bring an individual claim in small claims court, and either of us may ask a court to stop infringement of intellectual property.</p>
      <p><strong>No class actions.</strong> Claims may be brought only individually, not as a plaintiff or class member in any class, collective or representative action. If this waiver can't be enforced for a claim, that claim goes to court instead of arbitration.</p>
      <p><strong>Opting out.</strong> You can opt out of arbitration by emailing <SupportEmail /> within 30 days after you first accept these Terms, with your name, your account email and a statement that you opt out of arbitration.</p>
      <p><strong>Governing law.</strong> Delaware law governs these Terms, apart from its conflict-of-law rules. Any case that goes to court will be heard in the state or federal courts located in Delaware, unless the law where you live requires otherwise.</p>
    </>,
  },
  {
    id: 'changes',
    title: 'Changes to these Terms',
    body: <p>We may update these Terms. For an important change, we'll tell you by email or on the Service before it takes effect, and the date at the top will change. The new version applies from the next time you agree to it, for example when you next sign in or donate. Disputes are decided under the version that applied when they arose.</p>,
  },
  {
    id: 'ending',
    title: 'Ending the agreement',
    body: <p>You can stop using the Service and ask us to delete your account at any time from Settings or by writing to <SupportEmail />. We may suspend or end your access if you break these Terms. Sections that by their nature should continue, such as those on content licenses already used, payments, disclaimers, liability and disputes, continue after the agreement ends.</p>,
  },
  {
    id: 'general',
    title: 'General',
    body: <Bullets items={[
      <>These Terms and the policies they mention are the whole agreement between you and us about the Service.</>,
      <>If part of these Terms can't be enforced, the rest still applies. Not enforcing a term isn't a waiver of it.</>,
      <>You agree that we can send you notices and records electronically, by email or on the Service.</>,
      <>You may not transfer your rights under these Terms. We may transfer ours, for example if CouponDonation is sold or merged.</>,
      <>We aren't responsible for delays caused by events outside our reasonable control.</>,
    ]} />,
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Use"
      path="/terms"
      description="The terms for using CouponDonation: donations, fundraisers, coupons, refunds, content and how disputes are resolved."
      intro={<p>These Terms explain how CouponDonation works, what you can expect from us, and what we expect from you. We've kept them in plain English.</p>}
      sections={sections}
    />
  );
}
