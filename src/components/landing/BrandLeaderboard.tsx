import { useEffect, useRef, useState } from 'react';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { brandLogos, type BrandInfo } from '@/data/brandLogos';
import { useLandingStats } from '@/hooks/useLandingStats';
import { useMotionPreference } from '@/hooks/useMotionPreference';

type ChartDatum = { name: string; donations: number };

const findBrand = (name: string): BrandInfo | undefined => {
  const normalized = name.trim().toLowerCase();
  return brandLogos[name] ?? Object.values(brandLogos).find((brand) => brand.name.toLowerCase() === normalized);
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
    {brand && <img width={48} height={48} loading="lazy" decoding="async" src={brand.logo} alt="" className="h-8 w-8 object-contain" />}
    <div><p className="font-semibold text-foreground">{data.name}</p><p className="font-bold text-primary">${data.donations.toLocaleString()} allocated</p></div>
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

export function BrandLeaderboard() {
  const stats = useLandingStats();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartVisible, setChartVisible] = useState(false);
  const motionPreference = useMotionPreference();
  const [isPhone, setIsPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const on = () => setIsPhone(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const leaderboardData = (stats?.brands ?? []).slice(0, isPhone ? 4 : 6).map((brand) => ({ name: brand.name, donations: Math.round(brand.total) }));
  const animatedData = leaderboardData;

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setChartVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(chart);
    return () => observer.disconnect();
  }, [leaderboardData.length]);

  return <div className="mt-8 rounded-2xl bg-background py-6">
    <div className="container mx-auto max-w-5xl px-4">
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h2 className="text-base font-semibold text-foreground md:text-lg">Retailer allocations</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm"><span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse md:h-2 md:w-2" />Completed donations</div>
      </div>
      {leaderboardData.length ? <div ref={chartRef} className="h-[240px] w-full min-w-0 md:h-[320px]" data-chart-visible={chartVisible ? 'true' : 'false'}>
        <ResponsiveContainer width="100%" height="100%"><BarChart data={animatedData} margin={{ top: 30, right: 4, bottom: 70, left: 4 }}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={<CustomXAxisTick />} interval={0} height={70} /><YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
          <Bar dataKey="donations" radius={[8, 8, 0, 0]} maxBarSize={48} isAnimationActive={motionPreference === 'full'} animationBegin={0} animationDuration={350} animationEasing="ease-out">
            <LabelList dataKey="donations" content={<CustomLabel />} />
            {leaderboardData.map((entry, index) => { const brand = findBrand(entry.name); return <Cell key={entry.name} fill={brand?.color || 'hsl(var(--primary))'} className="transition-opacity duration-500 hover:opacity-80" style={{ filter: index === 0 ? brandGlow(brand?.color) : 'none' }} />; })}
          </Bar>
        </BarChart></ResponsiveContainer>
      </div> : <p className="py-16 text-center text-muted-foreground">Retailer totals will appear after the first completed donation.</p>}
    </div>
  </div>;
}