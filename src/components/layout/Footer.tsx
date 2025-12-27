import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import logo from '@/assets/logo.png';

export function Footer() {
  return (
    <footer className="bg-charcoal text-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="CouponDonation" className="w-10 h-10 object-contain" />
              <span className="font-bold text-xl">CouponDonation</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Connecting generosity with opportunity. Transforming lives through the power of giving.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/auth" className="hover:text-foreground transition-colors">Get Started</Link></li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="font-semibold mb-4">For Users</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/auth?mode=signup&role=donor" className="hover:text-foreground transition-colors">Become a Donor</Link></li>
              <li><Link to="/auth?mode=signup&role=recipient" className="hover:text-foreground transition-colors">Apply as Recipient</Link></li>
              <li><Link to="/auth" className="hover:text-foreground transition-colors">Partner With Us</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>hello@coupondonation.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>New York, NY | Los Angeles, CA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CouponDonation. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
