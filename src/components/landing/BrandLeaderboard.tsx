import { Card } from '@/components/ui/card';
import { Trophy, TrendingUp, Crown, Heart, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, LabelList } from 'recharts';
import { useState, useEffect } from 'react';
import { brandLogos } from '@/data/brandLogos';

const leaderboardData = [
  { name: 'DoorDash', donations: 450000 },
  { name: 'Walmart', donations: 380000 },
  { name: 'Uber', donations: 320000 },
  { name: 'Amazon', donations: 290000 },
  { name: 'Target', donations: 250000 },
  { name: 'Starbucks', donations: 210000 },
];

const topBrands = [
  { rank: 1, name: 'DoorDash', amount: '$450K', change: '+12%' },
  { rank: 2, name: 'Walmart', amount: '$380K', change: '+8%' },
  { rank: 3, name: 'Uber', amount: '$320K', change: '+15%' },
];

const recentDonations = [
  { name: 'Anonymous', amount: 50, brand: 'Walmart', time: '2 min ago' },
  { name: 'Sarah M.', amount: 100, brand: 'DoorDash', time: '5 min ago' },
  { name: 'Michael K.', amount: 25, brand: 'Uber', time: '8 min ago' },
  { name: 'Anonymous', amount: 75, brand: 'Target', time: '12 min ago' },
  { name: 'Jennifer L.', amount: 200, brand: 'Amazon', time: '15 min ago' },
];

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const brand = brandLogos[data.name];
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg flex items-center gap-3">
        <img src={brand?.logo} alt={data.name} className="w-8 h-8 object-contain" />
        <div>
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-primary font-bold">${(data.donations / 1000).toFixed(0)}K donated</p>
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
      ${(value / 1000).toFixed(0)}K
    </text>
  );
};

export function BrandLeaderboard() {
  const [latestDonation, setLatestDonation] = useState(recentDonations[0]);
  const [donationIndex, setDonationIndex] = useState(0);

  // Simulate live donation updates
  useEffect(() => {
    const interval = setInterval(() => {
      setDonationIndex((prev) => (prev + 1) % recentDonations.length);
      setLatestDonation(recentDonations[(donationIndex + 1) % recentDonations.length]);
    }, 4000);
    return () => clearInterval(interval);
  }, [donationIndex]);

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 px-4 py-2 rounded-full mb-6">
            <Trophy className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-gold">Live Leaderboard</span>
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
          <p className="text-lg text-muted-foreground">
            Watch real-time donations driving real change.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          {/* Top Donors - Now First */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-gold" />
              Top Donors This Month
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topBrands.map((brand) => {
                const brandInfo = brandLogos[brand.name];
                return (
                  <Card 
                    key={brand.rank}
                    className={`p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-card-hover ${
                      brand.rank === 1 ? 'border-gold/50 bg-gold/5' : ''
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${
                      brand.rank === 1 ? 'bg-gold/10 ring-2 ring-gold/30' : 'bg-muted'
                    }`}>
                      <img 
                        src={brandInfo?.logo} 
                        alt={brand.name}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">#{brand.rank}</span>
                        <span className="font-bold text-foreground truncate">{brand.name}</span>
                        {brand.rank === 1 && <span className="text-sm">👑</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-foreground">{brand.amount}</span>
                        <div className="flex items-center gap-1 text-primary text-sm">
                          <TrendingUp className="w-3 h-3" />
                          <span className="font-medium">{brand.change}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Live Donation Tracking - Now Second */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Live Donation Tracking</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Real-time
              </div>
            </div>

            {/* Vertical Bar Chart with Logos */}
            <div className="h-[320px]">
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
                          style={{
                            filter: index === 0 ? 'drop-shadow(0 4px 12px rgba(255, 48, 8, 0.3))' : 'none'
                          }}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Live Donation Ticker */}
            <div className="mt-4 pt-4 border-t border-border">
              <div 
                key={donationIndex}
                className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 animate-fade-in"
              >
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center flex-shrink-0 border border-border">
                  <img 
                    src={brandLogos[latestDonation.brand]?.logo}
                    alt={latestDonation.brand}
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-foreground truncate">{latestDonation.name}</span>
                    <span className="text-muted-foreground">donated</span>
                    <span className="font-bold text-primary">${latestDonation.amount}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span>to {latestDonation.brand}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{latestDonation.time}</span>
                  </div>
                </div>
                <Heart className="w-4 h-4 text-primary animate-pulse" />
              </div>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">Total this month</span>
              <span className="text-xl font-bold text-foreground">$1.9M+</span>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
