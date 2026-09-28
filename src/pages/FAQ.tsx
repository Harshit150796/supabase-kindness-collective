import { SEO, breadcrumbJsonLd } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';
import { useCMSFAQ } from '@/hooks/useCMSContent';

const hardcodedFaqs = [
  { question: 'How does CouponDonation work?', answer: 'CouponDonation connects donors who want to help with verified recipients in need. Donors contribute funds that are converted into coupons for essential goods. Recipients browse available coupons and redeem them at partner stores.' },
  { question: 'How are recipients verified?', answer: 'Recipients go through a multi-step verification process that includes income documentation and identity document review by our compliance team, and optionally, referrals from partner organizations. This ensures donations reach those who truly need them.' },
  { question: 'What categories of coupons are available?', answer: 'We offer coupons across essential categories including Food & Groceries, Healthcare, Education, Clothing, Transportation, and Utilities. Donors can choose to support specific categories.' },
  { question: 'How do I know my donation is making an impact?', answer: 'Donors have access to a detailed impact dashboard showing exactly how their contributions are being used, including the number of families helped, categories supported, and regional distribution within the US.' },
  { question: 'Is my personal information secure?', answer: 'Absolutely. Data is encrypted in transit and at rest via our payment and infrastructure providers, and we never share personal information. Recipient identities are protected - donors see impact metrics without personal details.' },
  { question: 'Can I donate to specific regions or causes?', answer: 'Yes! When making a donation, you can allocate your contribution to specific categories (like healthcare or education) or regions. You can also let us distribute where needs are greatest.' },
  { question: 'How long does recipient verification take?', answer: 'Most verifications are completed within 2-3 business days. You’ll receive email updates throughout the process, and you can track your application status in your dashboard.' },
  { question: 'What is the loyalty card program?', answer: 'Verified recipients receive a digital loyalty card. Each coupon redemption earns points that unlock additional benefits and shows their savings history. It’s our way of recognizing the journey to financial independence.' },
];

export default function FAQ() {
  const { data: cmsFaqs } = useCMSFAQ(true);
  const faqs = cmsFaqs?.length ? cmsFaqs.map((item: any) => ({ question:item.question, answer:item.answer })) : hardcodedFaqs;
  const faqJsonLd = { '@context':'https://schema.org', '@type':'FAQPage', mainEntity:faqs.map((item)=>({ '@type':'Question', name:item.question, acceptedAnswer:{ '@type':'Answer', text:item.answer } })) };
  return <div className="min-h-dvh bg-background"><SEO title="FAQ — Donations, Verification & Coupon Redemption" description="Answers about donating, recipient verification, coupon redemption, security, and how CouponDonation turns gifts into restricted coupon value." path="/faq" jsonLd={[breadcrumbJsonLd([{name:'Home',path:'/'},{name:'FAQ',path:'/faq'}]),faqJsonLd]}/><Navbar/><main><section className="py-24 md:py-36"><div className="container mx-auto px-4"><LineReveal><h1 className="max-w-4xl font-display text-6xl font-normal leading-none text-foreground md:text-8xl">Clear answers before you give.</h1></LineReveal><Reveal delay={.1}><p className="mt-8 max-w-2xl text-xl leading-relaxed text-muted-foreground">How donations, recipient review, coupon access, and account privacy work.</p></Reveal></div></section><section className="py-20 md:py-28" style={{backgroundColor:'hsl(var(--primary-97))'}}><div className="container mx-auto max-w-4xl px-4"><Accordion type="single" collapsible>{faqs.map((faq,index)=><Reveal key={faq.question} delay={index*.03}><AccordionItem value={`item-${index}`} className="mb-4 rounded-[1.5rem] border-0 bg-background px-6"><AccordionTrigger className="py-7 text-left font-display text-2xl font-normal text-foreground hover:no-underline md:text-3xl">{faq.question}</AccordionTrigger><AccordionContent className="max-w-3xl pb-7 text-base leading-relaxed text-muted-foreground">{faq.answer}</AccordionContent></AccordionItem></Reveal>)}</Accordion></div></section></main><Footer/></div>;
}