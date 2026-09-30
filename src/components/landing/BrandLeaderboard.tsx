import { Clock, Heart } from 'lucide-react';
import { useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { brandLogos, type BrandInfo } from '@/data/brandLogos';
import { supabase } from '@/integrations/supabase/client';
import { useLandingStats } from '@/hooks/useLandingStats';
import { useMotionPreference } from '@/hooks/useMotionPreference';

type RecentDonation = { name: string; amount: number; brand: string; time: string };
type ChartDatum = { name: string; donations: number };

const timeAgo = (iso: string) => {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const findBrand = (name: string): BrandInfo | undefined => {
  const normalized = name.trim().toLowerCase();
  return brandLogos[name] ?? Object.values(brandLogos).find((brand) => brand.name.toLowerCase() === normalized);
};

const firstRecognizedBrand = (brands: string) => {
  for (const name of brands.split(',').map((brand) => brand.trim()).filter(Boolean)) {
    const match = findBrand(name);
    if (match) return match;
  }
  return undefined;
};

const brandGlow = (color?: string) => {
  if (!color || !/^#[0-9a-f]{6}$/i.test(color)) return 'drop-shadow(0 4px 12px hsl(var(--primary) / 0.3))';
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `drop-shadow(0 4px 12px rgb(${red} ${green} ${blue} / 0.3))`;
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDatum }> }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const brand = findBrand(data.name);
  return <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-lg">
    {brand && <img src={brand.logo} alt="" className="h-8 w-8 object-contain" />}
    <div><p className="font-semibold text-foreground">{data.name}</p><p className="font-bold text-primary">${data.donations.toLocaleString()} donated</p></div>
  </div>;
}

function CustomXAxisTick({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  if (!payload) return null;
  const brand = findBrand(payload.value);
  return <g transform={`translate(${x},${y})`}>
    {brand && <image href={brand.logo} x={-18} y={8} width={36} height={36} preserveAspectRatio="xMidYMid meet" />}
    <text x={0} y={56} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">{payload.value}</text>
  </g>;
}

function CustomLabel({ x = 0, y = 0, width = 0, value = 0 }: { x?: number; y?: number; width?: number; value?: number }) {
  return <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize={12} fontWeight={700} className="fill-foreground">${value.toLocaleString()}</text>;
}

function DonationAvatar({ donation }: { donation: RecentDonation }) {
  const [failed, setFailed] = useState(false);
  const brand = firstRecognizedBrand(donation.brand);
  const initial = donation.name.trim().charAt(0).toUpperCase();
  return <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary md:h-10 md:w-10">
    {brand && !failed ? <img src={brand.logo} alt="" className="h-5 w-5 object-contain md:h-6 md:w-6" onError={() => setFailed(true)} />
      : initial ? <span className="text-xs font-semibold text-primary md:text-sm" aria-hidden="true">{initial}</span>
      : <Heart className="h-4 w-4 text-primary" aria-hidden="true" />}
  </div>;
}

export function BrandLeaderboard() {
  const stats = useLandingStats();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartVisible = useInView(chartRef, { once: true, amount: 0.35 });
  const motionPreference = useMotionPreference();
  const leaderboardData = (stats?.brands ?? []).slice(0, 6).map((brand) => ({ name: brand.name, donations: Math.round(brand.total) }));
  const animatedData = leaderboardData.map((brand) => ({ ...brand, donations: chartVisible ? brand.donations : 0 }));
  const [recent, setRecent] = useState<RecentDonation[]>([]);
  const [donationIndex, setDonationIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    supabase.rpc('get_recent_public_donations', { _limit: 5 }).then(({ data }) => {
      if (alive && data) setRecent(data.map((row: any) => ({ name: row.display_name || 'Anonymous', amount: Number(row.amount) || 0, brand: row.brand_partner || '', time: timeAgo(row.created_at) })));
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (recent.length < 2) return;
    const interval = window.setInterval(() => setDonationIndex((current) => (current + 1) % recent.length), 4000);
    return () => window.clearInterval(interval);
  }, [recent.length]);

  const latestDonation = recent[donationIndex];
  return <section className="bg-background py-24 md:py-36">
    <div className="container mx-auto max-w-5xl px-4">
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h2 className="text-base font-semibold text-foreground md:text-lg">Live Donation Tracking</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm"><span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse md:h-2 md:w-2" />Real-time</div>
      </div>
      {leaderboardData.length ? <div ref={chartRef} className="h-[240px] w-full min-w-0 md:h-[320px]" data-chart-visible={chartVisible ? 'true' : 'false'}>
        <ResponsiveContainer width="100%" height="100%"><BarChart data={animatedData} margin={{ top: 30, right: 4, bottom: 70, left: 4 }}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={<CustomXAxisTick />} interval={0} height={70} /><YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
          <Bar dataKey="donations" radius={[8, 8, 0, 0]} maxBarSize={48} isAnimationActive animationBegin={0} animationDuration={motionPreference === 'full' ? 1500 : 900} animationEasing="ease-out">
            <LabelList dataKey="donations" content={<CustomLabel />} />
            {leaderboardData.map((entry, index) => { const brand = findBrand(entry.name); return <Cell key={entry.name} fill={brand?.color || 'hsl(var(--primary))'} className="transition-opacity duration-500 hover:opacity-80" style={{ filter: index === 0 ? brandGlow(brand?.color) : 'none' }} />; })}
          </Bar>
        </BarChart></ResponsiveContainer>
      </div> : <p className="py-16 text-center text-muted-foreground">Retailer totals will appear after the first completed donation.</p>}
      {latestDonation && <div className="mt-3 border-t border-border pt-4 md:mt-4"><div key={donationIndex} className="flex min-w-0 items-center gap-2 py-2.5 animate-fade-in md:gap-3 md:py-3">
        <DonationAvatar donation={latestDonation} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-xs md:gap-x-2 md:text-sm"><span className="max-w-full truncate font-medium text-foreground">{latestDonation.name}</span><span className="text-muted-foreground">donated</span><span className="font-bold text-primary">${latestDonation.amount.toLocaleString()}</span></div>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">{latestDonation.brand && <span className="min-w-0 truncate">to {latestDonation.brand}</span>}{latestDonation.brand && <span aria-hidden="true">•</span>}<Clock className="h-3 w-3 flex-shrink-0" aria-hidden="true" /><span className="flex-shrink-0">{latestDonation.time}</span></div>
        </div><Heart className="h-4 w-4 flex-shrink-0 text-primary animate-pulse" aria-hidden="true" />
      </div></div>}
    </div>
  </section>;
}