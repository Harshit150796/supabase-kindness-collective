import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How does CouponDonation work?',
    answer: 'CouponDonation connects donors who want to help with verified recipients in need. Donors contribute funds that are converted into coupons for essential goods. Recipients browse available coupons and redeem them at partner stores.'
  },
  {
    question: 'How are recipients verified?',
    answer: 'Recipients go through a multi-step verification process that includes income documentation, government ID verification, and optionally, referrals from partner organizations. This ensures donations reach those who truly need them.'
  },
  {
    question: 'What categories of coupons are available?',
    answer: 'We offer coupons across essential categories including Food & Groceries, Healthcare, Education, Clothing, Transportation, and Utilities. Donors can choose to support specific categories.'
  },
  {
    question: 'How do I know my donation is making an impact?',
    answer: 'Donors have access to a detailed impact dashboard showing exactly how their contributions are being used, including the number of families helped, categories supported, and geographic distribution.'
  },
  {
    question: 'Is my personal information secure?',
    answer: 'Absolutely. We use bank-level encryption and never share personal information. Recipient identities are protected - donors see impact metrics without personal details.'
  },
  {
    question: 'Can I donate to specific regions or causes?',
    answer: 'Yes! When making a donation, you can allocate your contribution to specific categories (like healthcare or education) or regions. You can also let us distribute where needs are greatest.'
  },
  {
    question: 'How long does recipient verification take?',
    answer: 'Most verifications are completed within 2-3 business days. You\'ll receive email updates throughout the process, and you can track your application status in your dashboard.'
  },
  {
    question: 'What is the loyalty card program?',
    answer: 'Verified recipients receive a digital loyalty card. Each coupon redemption earns points that unlock additional benefits and shows their savings history. It\'s our way of recognizing the journey to financial independence.'
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-gold/5">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Frequently Asked Questions</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Find answers to common questions about CouponDonation.
            </p>
          </div>
        </section>

        {/* FAQ List */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card rounded-xl border border-border px-6"
                >
                  <AccordionTrigger className="text-left text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
