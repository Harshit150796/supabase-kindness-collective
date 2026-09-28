import { Heart, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, LabelList } from 'recharts';
import { useState, useEffect } from 'react';
import { brandLogos } from '@/data/brandLogos';
import { supabase } from '@/integrations/supabase/client';
import { useLandingStats, formatUSD } from '@/hooks/useLandingStats';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';

const timeAgo = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(m, 1)} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const brand = brandLogos[data.name];
    return (
      <div className="flex items-center gap-3 border border-border bg-background p-3 shadow-sm">
        <img src={brand?.logo} alt={data.name} className="w-8 h-8 object-contain" />
        <div>
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-primary font-bold">${data.donations.toLocaleString()} donated</p>
        </div>
      </div>
    );
  }
  return null;
};

// Custom X-axis tick with logo and text
const CustomXAxisTick = ({ x, y, payload }: any) => {
  const brand = brandLogos[payload.value];
  return (
    <g transform={`translate(${x},${y})`}>
      <image
        href={brand?.logo}
        x={-20}
        y={8}
        width={40}
        height={40}
        style={{ objectFit: 'contain' }}
      />
      <text
        x={0}
        y={58}
        textAnchor="middle"
        fill="currentColor"
        fontSize={11}
        fontWeight={600}
        className="fill-foreground"
      >
        {payload.value}
      </text>
    </g>
  );
};

// Custom label for bar values
const CustomLabel = ({ x, y, width, value }: any) => {
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      textAnchor="middle"
      fill="currentColor"
      fontSize={12}
      fontWeight={700}
      className="fill-foreground"
    >
      ${value.toLocaleString()}
    </text>
  );
};

export function BrandLeaderboard() {
  const stats = useLandingStats();
  const leaderboardData = (stats?.brands ?? []).slice(0, 6).map((b) => ({ name: b.name, donations: Math.round(b.total) }));
  const topBrands = leaderboardData.slice(0, 3).map((b, i) => ({ rank: i + 1, name: b.name, amount: formatUSD(b.donations) }));
  const [recent, setRecent] = useState<{ name: string; amount: number; brand: string; time: string }[]>([]);
  const [donationIndex, setDonationIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    supabase.rpc('get_recent_public_donations', { _limit: 5 }).then(({ data }) => {
      if (!alive || !data) return;
      setRecent(data.map((r: any) => ({
        name: r.display_name || 'A supporter',
        amount: Number(r.amount) || 0,
        brand: r.brand_partner || '',
        time: timeAgo(r.created_at),
      })));
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (recent.length < 2) return;
    const interval = setInterval(() => setDonationIndex((p) => (p + 1) % recent.length), 4000);
    return () => clearInterval(interval);
  }, [recent.length]);

  const latestDonation = recent[donationIndex];

  return (
    <section className="bg-background py-24 md:py-36">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 grid max-w-5xl gap-6 md:mb-16 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <LineReveal><h2 className="font-display text-5xl font-normal leading-none text-foreground md:text-6xl">See where donors choose to give.</h2></LineReveal>
          <Reveal delay={0.1}><p className="text-lg leading-relaxed text-muted-foreground">Retailer totals and recent donations come directly from completed contributions.</p></Reveal>
        </div>

        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          {/* Top Donors - Now First */}
          <div>
            <h3 className="font-display text-2xl font-normal text-foreground mb-4 md:text-3xl">Top retailers supported</h3>
            <div className="grid border-y border-border sm:grid-cols-2 md:grid-cols-3 md:divide-x md:divide-border">
              {topBrands.map((brand) => {
                const brandInfo = brandLogos[brand.name];
                return (
                  <div
                    key={brand.rank}
                    className="flex items-center gap-4 border-b border-border p-5 last:border-b-0 md:border-b-0"
                  >
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden">
                      <img 
                        src={brandInfo?.logo} 
                        alt={brand.name}
                        className="w-6 h-6 md:w-8 md:h-8 object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs md:text-sm font-medium text-muted-foreground">#{brand.rank}</span>
                        <span className="font-bold text-sm md:text-base text-foreground truncate">{brand.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg md:text-xl font-bold text-foreground">{brand.amount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {topBrands.length === 0 && <p className="border-y border-border py-8 text-muted-foreground">Retailer totals will appear after the first completed donation.</p>}
          </div>

          {/* Live Donation Tracking - Now Second */}
          <div className="border-y border-border py-6 md:py-8">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-semibold text-foreground">Live Donation Tracking</h3>
              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full animate-pulse" />
                Real-time
              </div>
            </div>

            {/* Vertical Bar Chart with Logos - Scrollable on mobile */}
            <div className="h-[240px] md:h-[320px] overflow-x-auto">
              <div className="min-w-[450px] sm:min-w-0 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={leaderboardData} 
                    margin={{ top: 30, right: 10, bottom: 70, left: 10 }}
                  >
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={<CustomXAxisTick />}
                      interval={0}
                      height={70}
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
                    <Bar 
                      dataKey="donations" 
                      radius={[8, 8, 0, 0]}
                      barSize={48}
                    >
                      <LabelList dataKey="donations" content={<CustomLabel />} />
                      {leaderboardData.map((entry, index) => {
                        const brand = brandLogos[entry.name];
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={brand?.color || 'hsl(var(--primary))'}
                            className="transition-all duration-500 hover:opacity-80"
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Donation Ticker */}
            {latestDonation && <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border">
              <div 
                key={donationIndex}
                className="flex items-center gap-2 border-l-2 border-primary bg-primary/5 p-3 md:gap-3 animate-fade-in"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-background flex items-center justify-center flex-shrink-0 border border-border">
                  <img 
                    src={brandLogos[latestDonation.brand]?.logo}
                    alt={latestDonation.brand}
                    className="w-5 h-5 md:w-6 md:h-6 object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                    <span className="font-medium text-foreground truncate">{latestDonation.name}</span>
                    <span className="text-muted-foreground hidden sm:inline">donated</span>
                    <span className="font-bold text-primary">${latestDonation.amount}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    {latestDonation.brand && <span className="truncate">to {latestDonation.brand}</span>}
                    <span className="hidden sm:inline">•</span>
                    <Clock className="w-3 h-3 hidden sm:inline" />
                    <span className="hidden sm:inline">{latestDonation.time}</span>
                  </div>
                </div>
                <Heart className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
              </div>
            </div>}

          </div>
        </div>
      </div>
    </section>
  );
}
