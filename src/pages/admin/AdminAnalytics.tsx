import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Gift, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';

type DateRange = '7' | '30' | '90' | 'all';

interface SignupData { date: string; count: number; }
interface DonationData { date: string; amount: number; }
interface RoleData { name: string; value: number; }
interface CouponStatusData { name: string; value: number; }
interface BrandData { name: string; amount: number; }
interface RecentUser { email: string; full_name: string | null; created_at: string; roles: string[]; }

const COLORS = ['hsl(var(--primary))', 'hsl(var(--gold))', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)'];

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDonations, setTotalDonations] = useState(0);
  const [totalCoupons, setTotalCoupons] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [signupData, setSignupData] = useState<SignupData[]>([]);
  const [donationData, setDonationData] = useState<DonationData[]>([]);
  const [roleData, setRoleData] = useState<RoleData[]>([]);
  const [couponStatusData, setCouponStatusData] = useState<CouponStatusData[]>([]);
  const [brandData, setBrandData] = useState<BrandData[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  const getDateFilter = () => {
    if (dateRange === 'all') return undefined;
    return subDays(new Date(), parseInt(dateRange)).toISOString();
  };

  const fetchAllData = async () => {
    setLoading(true);
    const since = getDateFilter();

    const [profilesRes, rolesRes, donationsRes, couponsRes, brandsRes] = await Promise.all([
      supabase.from('profiles').select('email, full_name, created_at').order('created_at', { ascending: true }),
      supabase.from('user_roles').select('role, user_id'),
      supabase.from('donations').select('amount, created_at, status'),
      supabase.from('coupons').select('status'),
      supabase.from('donation_brands').select('brand_name, allocated_amount'),
    ]);

    const profiles = profilesRes.data || [];
    const roles = rolesRes.data || [];
    const donations = donationsRes.data || [];
    const coupons = couponsRes.data || [];
    const brands = brandsRes.data || [];

    // Filter by date
    const filteredProfiles = since ? profiles.filter(p => p.created_at >= since) : profiles;
    const filteredDonations = since ? donations.filter(d => d.created_at >= since) : donations;

    // KPI cards
    setTotalUsers(profiles.length);
    const completedDonations = filteredDonations.filter(d => d.status === 'completed');
    setTotalDonations(completedDonations.reduce((sum, d) => sum + Number(d.amount), 0));
    setTotalCoupons(coupons.length);
    const redeemed = coupons.filter(c => c.status === 'redeemed').length;
    setConversionRate(coupons.length > 0 ? Math.round((redeemed / coupons.length) * 100) : 0);

    // Signup trends (group by date)
    const signupMap: Record<string, number> = {};
    filteredProfiles.forEach(p => {
      const day = format(parseISO(p.created_at), 'MMM dd');
      signupMap[day] = (signupMap[day] || 0) + 1;
    });
    setSignupData(Object.entries(signupMap).map(([date, count]) => ({ date, count })));

    // Donation trends
    const donationMap: Record<string, number> = {};
    completedDonations.forEach(d => {
      const day = format(parseISO(d.created_at), 'MMM dd');
      donationMap[day] = (donationMap[day] || 0) + Number(d.amount);
    });
    setDonationData(Object.entries(donationMap).map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 })));

    // Role breakdown
    const roleCounts: Record<string, number> = {};
    roles.forEach(r => { roleCounts[r.role] = (roleCounts[r.role] || 0) + 1; });
    setRoleData(Object.entries(roleCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })));

    // Coupon status
    const statusCounts: Record<string, number> = {};
    coupons.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });
    setCouponStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })));

    // Top brands
    const brandMap: Record<string, number> = {};
    brands.forEach(b => { brandMap[b.brand_name] = (brandMap[b.brand_name] || 0) + Number(b.allocated_amount); });
    setBrandData(
      Object.entries(brandMap)
        .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6)
    );

    // Recent users with roles
    const recentProfiles = profiles.slice(-10).reverse();
    const recentWithRoles: RecentUser[] = recentProfiles.map(p => {
      const userRoles = roles
        .filter(r => {
          // Match by checking profiles that share the same user
          return true; // We'll just show the profile info
        })
        .map(r => r.role);
      return { email: p.email, full_name: p.full_name, created_at: p.created_at, roles: [] };
    });
    setRecentUsers(recentWithRoles);

    setLoading(false);
  };

  const dateRangeOptions: { label: string; value: DateRange }[] = [
    { label: '7 Days', value: '7' },
    { label: '30 Days', value: '30' },
    { label: '90 Days', value: '90' },
    { label: 'All Time', value: 'all' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Platform Analytics</h1>
            <p className="text-muted-foreground">Overview of platform performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            {dateRangeOptions.map(opt => (
              <Button
                key={opt.value}
                variant={dateRange === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Donations</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${totalDonations.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Coupons</CardTitle>
              <Gift className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalCoupons}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{conversionRate}%</div>
              <p className="text-xs text-muted-foreground">Coupons redeemed vs total</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1: Signup + Donation Trends */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Signup Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {signupData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={signupData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" name="New Users" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">No signup data for this period</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Donation Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {donationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={donationData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`$${value}`, 'Amount']} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Donations" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">No donation data for this period</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2: Pie Charts + Brands */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {roleData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={roleData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coupon Status</CardTitle>
            </CardHeader>
            <CardContent>
              {couponStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={couponStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {couponStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground">No coupon data</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Brands by Donation</CardTitle>
            </CardHeader>
            <CardContent>
              {brandData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={brandData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => [`$${value}`, 'Amount']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="amount" fill="hsl(var(--gold))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground">No brand data</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Name</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Email</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-2 text-foreground">{user.full_name || 'N/A'}</td>
                      <td className="py-3 px-2 text-foreground">{user.email}</td>
                      <td className="py-3 px-2 text-muted-foreground">{format(parseISO(user.created_at), 'MMM dd, yyyy')}</td>
                    </tr>
                  ))}
                  {recentUsers.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
