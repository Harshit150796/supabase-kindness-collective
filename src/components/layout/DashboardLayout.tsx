import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Home, Gift, CreditCard, Clock, Shield, 
  BarChart, Users, LogOut, Menu, X,
  DollarSign, TrendingUp, FileText, BookOpen,
  MessageSquare, HelpCircle, Newspaper, Megaphone, Mail, Package
} from 'lucide-react';
import logo from '@/assets/logo.png';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, hasRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getNavItems = () => {
    if (hasRole('admin')) {
      return [
        { icon: Home, label: 'Overview', path: '/admin' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Shield, label: 'Verifications', path: '/admin/verifications' },
        { icon: Gift, label: 'Coupons', path: '/admin/coupons' },
        { icon: Package, label: 'Procurement', path: '/admin/procurement' },
        { icon: Megaphone, label: 'Fundraisers', path: '/admin/fundraisers' },
        { icon: DollarSign, label: 'Donations', path: '/admin/donations' },
        { icon: BarChart, label: 'Analytics', path: '/admin/analytics' },
        { icon: FileText, label: 'Content', path: '/admin/content' },
        { icon: BookOpen, label: 'Stories', path: '/admin/stories' },
        { icon: MessageSquare, label: 'Testimonials', path: '/admin/testimonials' },
        { icon: Newspaper, label: 'Blog Posts', path: '/admin/blog' },
        { icon: HelpCircle, label: 'FAQ', path: '/admin/faq' },
        { icon: Mail, label: 'Newsletters', path: '/admin/newsletters' },
      ];
    }
    // One generic account: giving and receiving are capabilities, not account types.
    return [
      { icon: Home, label: 'Home', path: '/dashboard' },
      { icon: Heart, label: 'Donate', path: '/dashboard/donate' },
      { icon: DollarSign, label: 'Your Giving', path: '/dashboard/giving' },
      { icon: TrendingUp, label: 'Your Impact', path: '/dashboard/impact' },
      { icon: Wallet, label: 'Voucher Wallet', path: '/dashboard/wallet' },
      { icon: CreditCard, label: 'Loyalty Card', path: '/dashboard/loyalty-card' },
      { icon: Megaphone, label: 'Your Requests', path: '/my-fundraisers' },
      { icon: Shield, label: 'Verification', path: '/dashboard/verification' },
    ];
  };

  const navItems = getNavItems();
  const roleLabel = hasRole('admin') ? 'Admin' : 'My Account';


  return (
    <div className="min-h-dvh bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden bg-background border-b border-border p-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="CouponDonation" className="w-8 h-8 object-contain" width={32} height={32} loading="eager" decoding="async" fetchPriority="high" />
          <span className="font-bold"><span className="text-[#2e7d32]">Coupon</span><span className="text-[#1565c0]">Donation</span></span>
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-background border-r border-border
          transform transition-transform lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-border hidden lg:block">
              <Link to="/" className="flex items-center gap-2">
                <img src={logo} alt="CouponDonation" className="w-10 h-10 object-contain" width={40} height={40} loading="eager" decoding="async" fetchPriority="high" />
                <span className="font-bold text-xl"><span className="text-[#2e7d32]">Coupon</span><span className="text-[#1565c0]">Donation</span></span>
              </Link>
            </div>

            {/* Role Badge */}
            <div className="px-6 py-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{roleLabel} Portal</div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 px-4 py-2 mb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 min-h-dvh">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
