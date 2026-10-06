import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useAuth } from '@/hooks/useAuth';
import { Coins, Menu, X, User, LogOut, Megaphone, Heart, Settings, DollarSign, Gift, MessageCircle } from 'lucide-react';
import { useState } from 'react';
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
  const unread = useUnreadMessages();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (hasRole('admin')) return '/admin';
    return '/dashboard';
  };


  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background lg:bg-background/90 lg:backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-18 items-center justify-between py-3">
          {/* Logo */}
          <Link to="/" className="group flex shrink-0 items-center gap-3">
            <img src={logo} alt="CouponDonation" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" width={48} height={48} loading="eager" decoding="async" {...({ fetchpriority: 'high' } as any)} />
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg leading-tight">
                <span className="brand-coupon">Coupon</span>
                <span className="brand-donation">Donation</span>
              </span>
              <span className="hidden text-xs text-muted-foreground leading-tight sm:block">Transforming Giving</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-3 whitespace-nowrap xl:flex xl:gap-8">
            <Link 
              to="/about" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
            >
              About Us
            </Link>
            <Link 
              to="/stories" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
            >
              Stories
            </Link>
            <Link 
              to="/how-it-works" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
            >
              How It Works
            </Link>
            <Link 
              to="/faq" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
            >
              FAQ
            </Link>
            <Link 
              to="/blog" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
            >
              Blog
            </Link>
            <Link to="/partners" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5">Partners</Link>
            <Button asChild size="sm"><Link to="/apply">Start a fundraiser</Link></Button>
          </div>

          {/* Auth Buttons */}
          <div className="hidden xl:flex items-center gap-3">
            {user && (
              <Link to="/messages" className="relative rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={unread ? `Messages, ${unread} unread` : 'Messages'}>
                <MessageCircle className="h-5 w-5" />
                {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">{unread > 9 ? '9+' : unread}</span>}
              </Link>
            )}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    My Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-3" />
                    Profile
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => navigate('/dashboard/donate')}>
                    <DollarSign className="w-4 h-4 mr-3" />
                    Donate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/wallet')}>
                    <Gift className="w-4 h-4 mr-3" />
                    Voucher Wallet
                  </DropdownMenuItem>

                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => navigate('/my-fundraisers')}>
                    <Megaphone className="w-4 h-4 mr-3" />
                    Your fundraisers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/messages')}>
                    <MessageCircle className="w-4 h-4 mr-3" />
                    Messages{unread > 0 ? ` (${unread})` : ''}
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
                  className="gap-2"
                >
                  <Coins className="w-4 h-4" />
                  Start Donating
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="xl:hidden p-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-6 space-y-4 border-t border-border animate-fade-in">
            <Link 
              to="/about" 
              className="block py-3 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </Link>
            <Link 
              to="/stories" 
              className="block py-3 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Stories
            </Link>
            <Link 
              to="/how-it-works" 
              className="block py-3 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link 
              to="/blog" 
              className="block py-3 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            {user && (
              <Link to="/messages" className="flex items-center gap-2 py-2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Messages{unread > 0 && <span className="rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">{unread}</span>}
              </Link>
            )}
            <Link 
              to="/faq" 
              className="block py-3 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link to="/partners" className="block py-3 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Partners</Link>
            <Button asChild className="w-full"><Link to="/apply" onClick={() => setMobileMenuOpen(false)}>Start a fundraiser</Link></Button>
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
                    onClick={() => { navigate('/dashboard/donate'); setMobileMenuOpen(false); }}
                  >
                    <DollarSign className="w-4 h-4" />
                    Donate
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2" 
                    onClick={() => { navigate('/dashboard/wallet'); setMobileMenuOpen(false); }}
                  >
                    <Gift className="w-4 h-4" />
                    Voucher Wallet
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
