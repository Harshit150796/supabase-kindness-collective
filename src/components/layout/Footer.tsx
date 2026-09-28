import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import logo from '@/assets/logo.png';

export function Footer() {
  return (
    <footer className="bg-[hsl(var(--primary-20))] text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-[1.5rem] bg-background px-4 py-3">
              <img src={logo} alt="CouponDonation" className="w-10 h-10 object-contain" />
              <span className="font-bold text-xl">
                <span className="text-[#2e7d32]">Coupon</span>
                <span className="text-[#1565c0]">Donation</span>
              </span>
            </div>
            <p className="max-w-xs font-display text-2xl leading-snug text-primary-foreground">
              Make the path of every donation visible.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/auth" className="hover:text-foreground transition-colors">Get Started</Link></li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="font-semibold mb-4">For Users</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/auth?mode=signup&role=donor" className="hover:text-foreground transition-colors">Become a Donor</Link></li>
              <li><Link to="/auth?mode=signup&role=recipient" className="hover:text-foreground transition-colors">Apply as Recipient</Link></li>
              <li><Link to="/auth" className="hover:text-foreground transition-colors">Partner With Us</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex min-w-0 items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="break-all">connect@coupondonation.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+1 (315) 898-6745</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>United States</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/20 pt-8 md:flex-row">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} CouponDonation. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/60">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
