import { PieChart, Heart, DollarSign, CheckCircle, ShoppingCart, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

function AnimatedProgress({ value, delay = 0, isVisible }: { value: number; delay?: number; isVisible: boolean }) {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    if (!isVisible) {
      setCurrent(0);
      return;
    }
    
    const timer = setTimeout(() => {
      const duration = 1500;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCurrent(Math.round(value * eased));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay, isVisible]);
  
  return current;
}

function AnimatedDonutChart({ isVisible }: { isVisible: boolean }) {
  const size = 180;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const segments = [
    { percent: 95, color: 'hsl(var(--primary))', label: 'Recipients' },
    { percent: 3, color: 'hsl(var(--muted-foreground) / 0.5)', label: 'Operations' },
    { percent: 2, color: 'hsl(var(--muted-foreground) / 0.3)', label: 'Processing' },
  ];
  
  let cumulativePercent = 0;
  
  return (
    <div className="relative flex items-center justify-center">
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        
        {segments.map((segment, index) => {
          const offset = circumference * (1 - segment.percent / 100);
          const rotation = (cumulativePercent / 100) * 360;
          cumulativePercent += segment.percent;
          
          return (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={isVisible ? offset : circumference}
              style={{
                transformOrigin: 'center',
                transform: `rotate(${rotation}deg)`,
                transition: `stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 200 + 300}ms`,
              }}
            />
          );
        })}
      </svg>
      
      <div 
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center transition-all duration-700",
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        )}
        style={{ transitionDelay: '600ms' }}
      >
        <span className="text-3xl font-bold text-primary">
          <AnimatedProgress value={95} delay={600} isVisible={isVisible} />¢
        </span>
        <span className="text-xs text-muted-foreground font-medium">of every $1</span>
      </div>
    </div>
  );
}

const breakdownItems = [
  { label: 'Direct to Recipients', percent: 95, color: 'bg-primary', icon: Heart },
  { label: 'Platform Operations', percent: 3, color: 'bg-muted-foreground/50', icon: PieChart },
  { label: 'Payment Processing', percent: 2, color: 'bg-muted-foreground/30', icon: DollarSign },
];

const howItWorksSteps = [
  { step: '1', title: 'You Donate', desc: 'Choose a brand & amount', icon: Heart },
  { step: '2', title: 'We Purchase', desc: 'Buy coupons at wholesale', icon: ShoppingCart },
  { step: '3', title: 'Families Receive', desc: 'Direct distribution', icon: Users },
  { step: '4', title: 'Impact Verified', desc: 'Transparent tracking', icon: CheckCircle },
];

function AnimatedConnector({ isVisible, delay }: { isVisible: boolean; delay: number }) {
  return (
    <div 
      className={cn(
        "hidden md:flex items-center justify-center transition-all duration-500",
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="relative">
        <ArrowRight className="w-5 h-5 text-primary/60" />
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            isVisible && "animate-pulse"
          )}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
        </div>
      </div>
    </div>
  );
}

type TabType = 'breakdown' | 'journey';

export function TrustTransparency() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('breakdown');
  const [tabAnimationKey, setTabAnimationKey] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setTabAnimationKey(prev => prev + 1);
    }
  }, [activeTab]);

  const isBreakdownVisible = isVisible && activeTab === 'breakdown';
  const isJourneyVisible = isVisible && activeTab === 'journey';
  
  return (
    <section ref={sectionRef} className="py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/5 blur-2xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-accent/10 blur-3xl" />
      
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span 
              className={cn(
                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 transition-all duration-500",
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              <CheckCircle className="w-4 h-4" />
              100% Transparent
            </span>
            <h2 
              className={cn(
                "text-3xl md:text-4xl font-bold text-foreground mb-3 transition-all duration-500",
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
              style={{ transitionDelay: '100ms' }}
            >
              Where Your Money Goes
            </h2>
            <p 
              className={cn(
                "text-muted-foreground max-w-2xl mx-auto transition-all duration-500",
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
              style={{ transitionDelay: '200ms' }}
            >
              Complete transparency in how your donation helps families in need.
            </p>
          </div>

          {/* Main Card */}
          <Card 
            className={cn(
              "p-6 md:p-8 border-primary/10 shadow-lg transition-all duration-700",
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
            style={{ transitionDelay: '300ms' }}
          >
            {/* Tab Switcher */}
            <div 
              className={cn(
                "flex justify-center mb-8 transition-all duration-500",
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
              style={{ transitionDelay: '350ms' }}
            >
              <div className="relative inline-flex bg-muted/50 rounded-full p-1">
                {/* Sliding indicator */}
                <div 
                  className={cn(
                    "absolute top-1 bottom-1 rounded-full bg-background shadow-md transition-all duration-300 ease-out",
                    activeTab === 'breakdown' ? 'left-1 w-[calc(50%-4px)]' : 'left-[calc(50%+2px)] w-[calc(50%-4px)]'
                  )}
                />
                
                <button
                  onClick={() => handleTabChange('breakdown')}
                  className={cn(
                    "relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-300",
                    activeTab === 'breakdown' 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <PieChart className="w-4 h-4" />
                  <span>Breakdown</span>
                </button>
                
                <button
                  onClick={() => handleTabChange('journey')}
                  className={cn(
                    "relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-300",
                    activeTab === 'journey' 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>The Journey</span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="relative min-h-[320px] md:min-h-[280px]">
              {/* Breakdown Tab */}
              <div 
                key={`breakdown-${tabAnimationKey}`}
                className={cn(
                  "transition-all duration-500",
                  activeTab === 'breakdown' 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
                )}
              >
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* Left: Donut Chart */}
                  <div 
                    className={cn(
                      "flex flex-col items-center transition-all duration-700",
                      isBreakdownVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                    )}
                    style={{ transitionDelay: '100ms' }}
                  >
                    <AnimatedDonutChart isVisible={isBreakdownVisible} />
                    <p className="mt-3 text-center text-sm text-muted-foreground">
                      goes directly to families
                    </p>
                  </div>
                  
                  {/* Right: Breakdown List */}
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <PieChart className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Donation Breakdown</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {breakdownItems.map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <div 
                            key={item.label}
                            className={cn(
                              "transition-all duration-500",
                              isBreakdownVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                            )}
                            style={{ transitionDelay: `${200 + i * 150}ms` }}
                          >
                            <div className="flex justify-between items-center text-sm mb-1.5">
                              <span className="flex items-center gap-2 text-foreground font-medium">
                                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                                {item.label}
                              </span>
                              <span className="text-foreground font-bold tabular-nums">
                                <AnimatedProgress value={item.percent} delay={200 + i * 150} isVisible={isBreakdownVisible} />%
                              </span>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full transition-all duration-1000 ease-out", item.color)}
                                style={{ 
                                  width: isBreakdownVisible ? `${item.percent}%` : '0%',
                                  transitionDelay: `${300 + i * 150}ms`
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Journey Tab */}
              <div 
                key={`journey-${tabAnimationKey}`}
                className={cn(
                  "transition-all duration-500",
                  activeTab === 'journey' 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
                )}
              >
                <div className="text-center mb-8">
                  <h3 
                    className={cn(
                      "text-lg font-semibold text-foreground mb-2 transition-all duration-500",
                      isJourneyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    )}
                    style={{ transitionDelay: '100ms' }}
                  >
                    From Your Donation to Families in Need
                  </h3>
                  <p 
                    className={cn(
                      "text-sm text-muted-foreground max-w-lg mx-auto transition-all duration-500",
                      isJourneyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    )}
                    style={{ transitionDelay: '150ms' }}
                  >
                    Every step of your donation journey is tracked and verified
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-7 gap-4 md:gap-2 items-start">
                  {howItWorksSteps.map((item, index) => {
                    const Icon = item.icon;
                    const stepDelay = 200 + index * 120;
                    const connectorDelay = 240 + index * 120;
                    
                    return (
                      <div key={item.step} className="contents">
                        <div 
                          className={cn(
                            "text-center group transition-all duration-500",
                            isJourneyVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                          )}
                          style={{ transitionDelay: `${stepDelay}ms` }}
                        >
                          <div className="relative mx-auto mb-3">
                            {/* Glow effect */}
                            <div 
                              className={cn(
                                "absolute inset-0 rounded-full bg-primary/20 blur-md transition-all duration-500",
                                isJourneyVisible ? 'opacity-100 scale-125' : 'opacity-0 scale-100'
                              )}
                              style={{ transitionDelay: `${stepDelay + 100}ms` }}
                            />
                            {/* Main circle */}
                            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto shadow-lg shadow-primary/25 group-hover:scale-110 group-hover:shadow-primary/40 transition-all duration-300">
                              {item.step}
                            </div>
                            {/* Icon badge */}
                            <div 
                              className={cn(
                                "absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center shadow-sm transition-all duration-500",
                                isJourneyVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                              )}
                              style={{ transitionDelay: `${stepDelay + 200}ms` }}
                            >
                              <Icon className="w-3.5 h-3.5 text-primary" />
                            </div>
                          </div>
                          <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                          <p className="text-xs text-muted-foreground leading-tight">{item.desc}</p>
                        </div>
                        {index < howItWorksSteps.length - 1 && (
                          <AnimatedConnector isVisible={isJourneyVisible} delay={connectorDelay} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Bottom callout */}
            <div 
              className={cn(
                "mt-8 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/10 transition-all duration-500",
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
              style={{ transitionDelay: '500ms' }}
            >
              <p className="text-center text-foreground text-sm">
                <strong className="text-primary">95¢ of every dollar</strong> goes directly 
                to purchasing coupons for families in need.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
