import { NEEDS } from '@/data/needs';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { SectionLabel } from '@/components/ui/organizer';
import logo from '@/assets/logo.png';

const linkClass = 'inline-flex min-h-11 items-center py-2.5 transition-colors hover:text-primary-foreground';
export function Footer() {
  return <footer className="footer-surface text-primary-foreground">
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:pb-24 md:pt-14 sm:px-6 lg:px-8 lg:pt-16">
      <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-12 md:gap-x-8 md:gap-y-10">
        <div className="col-span-2 space-y-4 md:col-span-12 lg:col-span-4">
          <div data-footer-lockup className="footer-lockup flex w-fit max-w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-3">
            <img src={logo} alt="" className="h-10 w-10 shrink-0 object-contain" />
            <span data-footer-wordmark className="font-sans text-xl font-bold"><span className="brand-coupon">Coupon</span><span className="brand-donation">Donation</span></span>
          </div>
          <p className="max-w-xs font-sans text-[16px] leading-6 md:text-[18px] md:leading-7 text-primary-foreground">Make the path of every donation visible.</p>
        </div>
        <div className="md:col-span-3 lg:col-span-2">
          <SectionLabel className="mb-2 md:mb-4 text-primary-foreground/65">Discover</SectionLabel>
          <ul className="text-[15px] leading-[23px] text-primary-foreground/85">
            <li><Link to="/about" className={linkClass}>About us</Link></li><li><Link to="/how-it-works" className={linkClass}>How it works</Link></li><li><Link to="/faq" className={linkClass}>FAQ</Link></li><li><Link to="/stories" className={linkClass}>Fundraisers</Link></li>
          </ul>
        </div>
        <div className="md:col-span-3 lg:col-span-2">
          <SectionLabel className="mb-2 md:mb-4 text-primary-foreground/65">Take part</SectionLabel>
          <ul className="text-[15px] leading-[23px] text-primary-foreground/85">
            <li><Link to="/donate" className={linkClass}>Give support</Link></li><li><Link to="/apply" className={linkClass}>Start a fundraiser</Link></li><li><Link to="/partners" className={linkClass}>Partner with us</Link></li><li><Link to="/auth?mode=signup" className={linkClass}>Create an account</Link></li>
          </ul>
        </div>
        <div className="col-span-2 md:col-span-3 lg:col-span-2">
          <SectionLabel className="mb-2 md:mb-4 text-primary-foreground/65">Find help</SectionLabel>
          <ul className="grid grid-cols-2 gap-x-6 md:grid-cols-1 text-[15px] leading-[23px] text-primary-foreground/85">{NEEDS.map(n => <li key={n.slug}><Link to={`/help/${n.slug}`} className={linkClass}>{n.name}</Link></li>)}</ul>
        </div>
        <div className="col-span-2 min-w-0 md:col-span-3 lg:col-span-2">
          <SectionLabel className="mb-2 md:mb-4 text-primary-foreground/65">Contact</SectionLabel>
          <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 md:grid-cols-1 md:space-y-2 text-[13px] leading-5 text-primary-foreground/85">
            <li className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" /><a href="mailto:support@coupondonation.com" className="min-h-11 inline-flex items-center min-w-0 break-words hover:text-primary-foreground">support@<wbr />coupondonation.com</a></li>
            <li className="flex flex-wrap items-center gap-x-2"><span className="text-primary-foreground/65">Partnerships</span><a href="mailto:connect@coupondonation.com" className="min-h-11 inline-flex items-center break-words hover:text-primary-foreground">connect@<wbr />coupondonation.com</a></li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /><a href="tel:+13158986745" className="inline-flex min-h-11 items-center">+1 (315) 898-6745</a></li>
            <li className="flex min-h-11 items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /><span>United States</span></li>
          </ul>
        </div>
      </div>
      <div className="mt-6 md:mt-12 flex flex-col justify-between gap-2 md:gap-5 border-t border-primary-foreground/20 pt-4 md:pt-6 text-[13px] leading-5 text-primary-foreground/70 md:flex-row">
        <p>© {new Date().getFullYear()} CouponDonation. All rights reserved.</p>
        <div className="flex flex-wrap gap-x-6"><Link to="/privacy" className={linkClass}>Privacy policy</Link><Link to="/cookies" className={linkClass}>Cookie policy</Link><Link to="/terms" className={linkClass}>Terms of service</Link></div>
      </div>
    </div>
  </footer>;
}
