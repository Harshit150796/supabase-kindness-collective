import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Coins, Menu, X, User, LogOut, Megaphone, Heart, Settings, DollarSign, Gift } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import logo from '@/assets/logo.png';

export function Navbar() {
  const { user, hasRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (hasRole('admin')) return '/admin';
    if (hasRole('donor')) return '/donor';
    if (hasRole('recipient')) return '/recipient';
    return '/';
  };

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 relative transition-[background-color,box-shadow,border-color] duration-500 ease-out',
        'bg-gradient-glass backdrop-blur-xl backdrop-saturate-150',
        'border-b',
        scrolled
          ? 'border-glass-border/60 shadow-glass'
          : 'border-transparent shadow-none'
      )}
    >
      {/* Inner glass highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-glass-highlight/60" />
      {/* Soft haze at the sky/nav seam */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-full bg-gradient-haze transition-opacity duration-500 ease-out',
          scrolled ? 'h-6 opacity-70' : 'h-10 opacity-100'
        )}
      />
      <div className="container relative mx-auto px-4">
        <div className="flex h-18 items-center justify-between py-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="relative flex items-center justify-center">
              <span className="pointer-events-none absolute inset-0 rounded-full bg-glow-warm/0 blur-lg transition-all duration-500 group-hover:bg-glow-warm/30 group-hover:scale-125" />
              <img src={logo} alt="CouponDonation" className="relative w-10 h-10 sm:w-12 sm:h-12 object-contain" width={48} height={48} loading="eager" decoding="async" {...({ fetchpriority: 'high' } as any)} />
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg leading-tight">
                <span className="text-[#2e7d32]">Coupon</span>
                <span className="text-[#1565c0]">Donation</span>
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">Transforming Giving</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {[
              { to: '/about', label: 'About Us' },
              { to: '/stories', label: 'Stories' },
              { to: '/how-it-works', label: 'How It Works' },
              { to: '/faq', label: 'FAQ' },
              { to: '/blog', label: 'Blog' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group relative rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground hover:bg-glass-highlight/40"
              >
                {item.label}
                <span className="pointer-events-none absolute bottom-1 left-1/2 h-px w-0 -translate-x-1/2 bg-primary/50 transition-all duration-300 group-hover:w-1/2" />
              </Link>
            ))}
          </div>


          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="group relative">
                    <span className="pointer-events-none absolute -inset-2 rounded-full bg-glow-warm/15 blur-xl transition-all duration-500 group-hover:bg-glow-warm/30" />
                    <Button variant="outline" size="sm" className="relative gap-2 bg-glass/50 backdrop-blur-sm border-glass-border/70">
                      <User className="w-4 h-4" />
                      My Account
                    </Button>
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-3" />
                    Profile
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => navigate('/donor')}>
                    <DollarSign className="w-4 h-4 mr-3" />
                    Donor Portal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/recipient')}>
                    <Gift className="w-4 h-4 mr-3" />
                    Recipient Portal
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => navigate('/my-fundraisers')}>
                    <Megaphone className="w-4 h-4 mr-3" />
                    Your fundraisers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-impact')}>
                    <Heart className="w-4 h-4 mr-3" />
                    Your impact
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="w-4 h-4 mr-3" />
                    Account settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/auth')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/donate')}
                  className="gap-2 shadow-emerald hover:shadow-gold transition-shadow"
                >
                  <Coins className="w-4 h-4" />
                  Start Donating
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-6 space-y-4 border-t border-border animate-fade-in">
            <Link 
              to="/about" 
              className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </Link>
            <Link 
              to="/stories" 
              className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Stories
            </Link>
            <Link 
              to="/how-it-works" 
              className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link 
              to="/blog" 
              className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link 
              to="/faq" 
              className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <div className="pt-4 border-t border-border space-y-3">
              {user ? (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2" 
                    onClick={() => { navigate('/my-fundraisers'); setMobileMenuOpen(false); }}
                  >
                    <Megaphone className="w-4 h-4" />
                    Your fundraisers
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2" 
                    onClick={() => { navigate('/my-impact'); setMobileMenuOpen(false); }}
                  >
                    <Heart className="w-4 h-4" />
                    Your impact
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2" 
                    onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2" 
                    onClick={() => { navigate('/donor'); setMobileMenuOpen(false); }}
                  >
                    <DollarSign className="w-4 h-4" />
                    Donor Portal
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2" 
                    onClick={() => { navigate('/recipient'); setMobileMenuOpen(false); }}
                  >
                    <Gift className="w-4 h-4" />
                    Recipient Portal
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-destructive justify-start gap-2" 
                    onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => { navigate('/donate'); setMobileMenuOpen(false); }}
                  >
                    <Coins className="w-4 h-4" />
                    Start Donating
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
