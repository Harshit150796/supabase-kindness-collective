import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Gift, BarChart, ArrowRight, Clock, Layout, Heart, MessageSquareQuote, FileText, HelpCircle, Megaphone } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  pendingVerifications: number;
  totalCoupons: number;
  availableCoupons: number;
  publishedStories: number;
  publishedPosts: number;
  testimonials: number;
  faqItems: number;
  totalFundraisers: number;
  activeFundraisers: number;
  pendingFundraisers: number;
}

const platformActions = [
  { title: 'Manage Users', description: 'View and manage all users, promote to admin', path: '/admin/users', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
  { title: 'Verifications', description: 'Approve/reject recipient applications', path: '/admin/verifications', icon: Shield, color: 'text-gold', bg: 'bg-gold/10' },
  { title: 'Coupons', description: 'View and manage coupon inventory', path: '/admin/coupons', icon: Gift, color: 'text-emerald-light', bg: 'bg-emerald-light/10' },
  { title: 'Fundraisers', description: 'Moderate and manage all fundraiser campaigns', path: '/admin/fundraisers', icon: Megaphone, color: 'text-primary', bg: 'bg-primary/10' },
  { title: 'Analytics', description: 'Signup trends, donation charts, stats', path: '/admin/analytics', icon: BarChart, color: 'text-primary', bg: 'bg-primary/10' },
];

const contentActions = [
  { title: 'Site Content', description: 'Edit hero text, CTA buttons, section titles', path: '/admin/content', icon: Layout, color: 'text-primary', bg: 'bg-primary/10' },
  { title: 'Impact Stories', description: 'Add/edit stories with photos, toggle featured', path: '/admin/stories', icon: Heart, color: 'text-destructive', bg: 'bg-destructive/10' },
  { title: 'Testimonials', description: 'Manage donor and recipient quotes', path: '/admin/testimonials', icon: MessageSquareQuote, color: 'text-gold', bg: 'bg-gold/10' },
  { title: 'Blog Posts', description: 'Write and publish articles with cover images', path: '/admin/blog', icon: FileText, color: 'text-emerald-light', bg: 'bg-emerald-light/10' },
  { title: 'FAQ', description: 'Add/edit questions and answers', path: '/admin/faq', icon: HelpCircle, color: 'text-primary', bg: 'bg-primary/10' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0, pendingVerifications: 0, totalCoupons: 0, availableCoupons: 0,
    publishedStories: 0, publishedPosts: 0, testimonials: 0, faqItems: 0,
    totalFundraisers: 0, activeFundraisers: 0, pendingFundraisers: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [usersResult, verificationsResult, couponsResult, storiesResult, postsResult, testimonialsResult, faqResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('recipient_verifications').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('coupons').select('id, status', { count: 'exact' }),
      supabase.from('cms_stories').select('id', { count: 'exact' }).eq('is_published', true),
      supabase.from('cms_posts').select('id', { count: 'exact' }).eq('is_published', true),
      supabase.from('cms_testimonials').select('id', { count: 'exact' }).eq('is_published', true),
      supabase.from('cms_faq').select('id', { count: 'exact' }).eq('is_published', true),
    ]);

    setStats({
      totalUsers: usersResult.count || 0,
      pendingVerifications: verificationsResult.count || 0,
      totalCoupons: couponsResult.count || 0,
      availableCoupons: couponsResult.data?.filter(c => c.status === 'available').length || 0,
      publishedStories: storiesResult.count || 0,
      publishedPosts: postsResult.count || 0,
      testimonials: testimonialsResult.count || 0,
      faqItems: faqResult.count || 0,
    });
  };

  const ActionCard = ({ title, description, path, icon: Icon, color, bg }: typeof platformActions[0]) => (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(path)}>
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage the CouponDonation platform</p>
        </div>

        {stats.pendingVerifications > 0 && (
          <Card className="border-gold bg-gold/5">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gold" />
                <div>
                  <p className="font-medium text-foreground">{stats.pendingVerifications} Pending Verifications</p>
                  <p className="text-sm text-muted-foreground">Users waiting for approval</p>
                </div>
              </div>
              <Button onClick={() => navigate('/admin/verifications')}>Review Now</Button>
            </CardContent>
          </Card>
        )}

        {/* Platform Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary', sub: 'Registered users', path: '/admin/users' },
            { label: 'Pending Verifications', value: stats.pendingVerifications, icon: Shield, color: 'text-gold', sub: 'Awaiting review', path: '/admin/verifications' },
            { label: 'Total Coupons', value: stats.totalCoupons, icon: Gift, color: 'text-emerald-light', sub: 'All time', path: '/admin/coupons' },
            { label: 'Available Coupons', value: stats.availableCoupons, icon: BarChart, color: 'text-primary', sub: 'Ready to claim', path: '/admin/coupons' },
          ].map(s => (
            <Card key={s.label} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(s.path)}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CMS Content Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Published Stories', value: stats.publishedStories, icon: Heart, color: 'text-destructive', path: '/admin/stories' },
            { label: 'Blog Posts', value: stats.publishedPosts, icon: FileText, color: 'text-emerald-light', path: '/admin/blog' },
            { label: 'Testimonials', value: stats.testimonials, icon: MessageSquareQuote, color: 'text-gold', path: '/admin/testimonials' },
            { label: 'FAQ Items', value: stats.faqItems, icon: HelpCircle, color: 'text-primary', path: '/admin/faq' },
          ].map(s => (
            <Card key={s.label} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(s.path)}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <p className="text-xs text-muted-foreground">Published</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform Management */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Platform Management</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {platformActions.map(a => <ActionCard key={a.path} {...a} />)}
          </div>
        </div>

        {/* Content Management */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Content Management</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentActions.map(a => <ActionCard key={a.path} {...a} />)}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
