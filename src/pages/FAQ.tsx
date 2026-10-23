import { SEO, breadcrumbJsonLd } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';
import { useCMSFAQ } from '@/hooks/useCMSContent';

/** Earlier CMS questions whose answers made claims we can't back up; their reviewed versions are above. */
const RETIRED_QUESTIONS = new Set([
  'how are recipients verified?',
  'what categories of coupons are available?',
  'can i donate to specific regions or causes?',
  'how long does recipient verification take?',
]);

const hardcodedFaqs = [
  { question: "How does CouponDonation work?", answer: "People in need post a fundraiser. Donors give to a fundraiser, or choose the stores their gift is used at, and our team turns each gift into store coupons and gift cards for stores like Walmart, Kroger and CVS. Nothing is paid out as cash." },
  { question: "Is my donation tax-deductible?", answer: "No. CouponDonation Inc. is a company, not a registered 501(c)(3) charity, so we don't issue tax-deductible receipts. You do get a receipt for every gift that shows where it went." },
  { question: "How much of my gift reaches the family?", answer: "100% of your gift goes to the family as store coupons and gift cards. We take no platform fee. You can add an optional tip, which pays for running CouponDonation, and choose to cover the card processing fee." },
  { question: "How are requests reviewed?", answer: "Our team reviews requests and can ask for more information, such as proof of identity. We remove requests that break our Fundraiser Rules, and anyone can report a fundraiser from its page." },
  { question: "What can recipients ask for?", answer: "Recipients choose what they need help with, such as groceries, health, school or bills, and the stores that would help most. Donors see those stores on the fundraiser page." },
  { question: "How do I know my donation is making an impact?", answer: "You get a receipt for every gift. Your dashboard lists each gift and the stores you chose, and fundraiser pages show how much has been turned into coupons and how much has been used." },
  { question: "Can I choose where my donation goes?", answer: "Yes. Give from a fundraiser's page to support that family, and choose which stores your gift is used at. We don't pool gifts by region or category." },
  { question: "Is my personal information secure?", answer: "Your data travels encrypted, and our database limits who can see what. We share data only with the service providers that run the site, such as Square for payments, and never sell it. Recipients never see donors' email addresses or contact details. Fundraiser stories and photos are public because recipients choose to share them. Our Privacy Policy has the details." },
  { question: "How long does it take for coupons to arrive?", answer: "After a gift, our team issues the coupons by hand, so timing varies. Recipients see their coupons in their account wallet once they're issued." },
  { question: "Who can apply for help?", answer: "Adults 18 or older who live in the United States, for themselves, their family, or, as a community group, for people they support. Applying is free." },
  { question: "What is the loyalty card program?", answer: "Recipients receive a digital loyalty card that shows their savings history. Gold Coins and loyalty rewards have no cash value, and we may change the program at any time." },
];

export default function FAQ() {
  const { data: cmsFaqs } = useCMSFAQ(true);
  // The reviewed answers below always lead (legal review, Oct 2026); CMS entries are added only for new questions.
  const reviewed = new Set(hardcodedFaqs.map((item) => item.question.toLowerCase()));
  const extra = (cmsFaqs ?? []).map((item: any) => ({ question: item.question as string, answer: item.answer as string }))
    .filter((item) => !reviewed.has(item.question.toLowerCase()) && !RETIRED_QUESTIONS.has(item.question.toLowerCase()));
  const faqs = [...hardcodedFaqs, ...extra];
  const faqJsonLd = { '@context':'https://schema.org', '@type':'FAQPage', mainEntity:faqs.map((item)=>({ '@type':'Question', name:item.question, acceptedAnswer:{ '@type':'Answer', text:item.answer } })) };
  return <div className="min-h-dvh bg-background"><SEO title="FAQ: Donations, Gift Cards, Fees and Getting Help" description="How donations become gift cards, what it costs, who can ask for help, how requests are reviewed, how fast gift cards arrive and how to track a gift." path="/faq" jsonLd={[breadcrumbJsonLd([{name:'Home',path:'/'},{name:'FAQ',path:'/faq'}]),faqJsonLd]}/><Navbar/><main><section className="py-24 md:py-36"><div className="container mx-auto px-4"><LineReveal><h1 className="max-w-4xl font-display text-6xl font-normal leading-none text-foreground md:text-8xl">Clear answers before you give.</h1></LineReveal><Reveal delay={.1}><p className="mt-8 max-w-2xl text-xl leading-relaxed text-muted-foreground">How donations, recipient review, coupon access, and account privacy work.</p></Reveal></div></section><section className="py-20 md:py-28" style={{backgroundColor:'hsl(var(--primary-97))'}}><div className="container mx-auto max-w-4xl px-4"><Accordion type="single" collapsible>{faqs.map((faq,index)=><Reveal key={faq.question} delay={index*.03}><AccordionItem value={`item-${index}`} className="mb-4 rounded-[1.5rem] border-0 bg-background px-6"><AccordionTrigger className="py-7 text-left font-display text-2xl font-normal text-foreground hover:no-underline md:text-3xl">{faq.question}</AccordionTrigger><AccordionContent forceMount className="max-w-3xl pb-7 text-base leading-relaxed text-muted-foreground">{faq.answer}</AccordionContent></AccordionItem></Reveal>)}</Accordion></div></section></main><Footer/></div>;
}