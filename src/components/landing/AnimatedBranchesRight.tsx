import { useEffect, useRef, useState } from 'react';

export function AnimatedBranchesRight() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute top-0 right-0 w-full h-full overflow-hidden"
      style={{ pointerEvents: 'none', zIndex: 1 }}
    >
      <svg
        viewBox="0 0 200 1200"
        className="absolute top-0 right-0 h-full"
        style={{ width: '180px', opacity: 0.7 }}
        preserveAspectRatio="xMaxYMin slice"
      >
        {/* Main descending vine from top-right */}
        <path
          d="M180,0 Q175,60 170,120 Q165,180 172,240 Q178,300 168,360 Q160,420 165,480 Q170,540 162,600"
          fill="none"
          stroke="#059669"
          strokeWidth="8"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDuration: '3.5s' } as React.CSSProperties}
        />
        {/* Inner grain */}
        <path
          d="M180,0 Q175,60 170,120 Q165,180 172,240 Q178,300 168,360 Q160,420 165,480 Q170,540 162,600"
          fill="none"
          stroke="#10B981"
          strokeWidth="4"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '0.3s', animationDuration: '3.5s' } as React.CSSProperties}
        />

        {/* Branch offshoots extending left */}
        <path
          d="M172,150 Q150,140 130,145 Q110,150 90,140"
          fill="none"
          stroke="#059669"
          strokeWidth="5"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'sway-branch' : ''}`}
          style={{ '--vine-duration': '2s', animationDelay: '1.5s' } as React.CSSProperties}
        />
        <path
          d="M170,280 Q148,270 128,278 Q108,285 85,275"
          fill="none"
          stroke="#10B981"
          strokeWidth="4.5"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'sway-branch-slow' : ''}`}
          style={{ '--vine-duration': '2s', animationDelay: '2s' } as React.CSSProperties}
        />
        <path
          d="M166,400 Q145,395 125,400 Q105,405 80,395"
          fill="none"
          stroke="#059669"
          strokeWidth="4"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'sway-branch' : ''}`}
          style={{ '--vine-duration': '2s', animationDelay: '2.5s' } as React.CSSProperties}
        />
        <path
          d="M164,520 Q140,510 120,518"
          fill="none"
          stroke="#10B981"
          strokeWidth="3.5"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'sway-branch-slow' : ''}`}
          style={{ '--vine-duration': '1.5s', animationDelay: '3s' } as React.CSSProperties}
        />

        {/* Smaller twigs */}
        <path
          d="M135,143 Q120,125 105,118"
          fill="none"
          stroke="#34D399"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '2.5s', animationDuration: '1.2s' } as React.CSSProperties}
        />
        <path
          d="M130,275 Q115,260 100,255"
          fill="none"
          stroke="#34D399"
          strokeWidth="2"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '3s', animationDuration: '1.2s' } as React.CSSProperties}
        />

        {/* Vine tendrils (curling) */}
        <path
          d="M90,140 Q82,132 85,125 Q88,120 84,115"
          fill="none"
          stroke="#34D399"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '3.2s', animationDuration: '1s' } as React.CSSProperties}
        />
        <path
          d="M85,275 Q78,268 80,260 Q83,255 79,250"
          fill="none"
          stroke="#34D399"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '3.5s', animationDuration: '1s' } as React.CSSProperties}
        />

        {/* Leaves */}
        {isVisible && (
          <g>
            <ellipse cx="92" cy="138" rx="5" ry="2.5" fill="#10B981" transform="rotate(-40 92 138)" className="tree-leaf" style={{ animationDelay: '3.5s' } as React.CSSProperties} />
            <ellipse cx="108" cy="118" rx="4" ry="2" fill="#34D399" transform="rotate(-30 108 118)" className="tree-leaf" style={{ animationDelay: '3.7s' } as React.CSSProperties} />
            <ellipse cx="130" cy="147" rx="5" ry="2.5" fill="#059669" transform="rotate(-20 130 147)" className="tree-leaf" style={{ animationDelay: '3.9s' } as React.CSSProperties} />
            <ellipse cx="88" cy="273" rx="5" ry="2.5" fill="#10B981" transform="rotate(-45 88 273)" className="tree-leaf" style={{ animationDelay: '4.1s' } as React.CSSProperties} />
            <ellipse cx="102" cy="253" rx="4" ry="2" fill="#34D399" transform="rotate(-25 102 253)" className="tree-leaf" style={{ animationDelay: '4.3s' } as React.CSSProperties} />
            <ellipse cx="82" cy="393" rx="5" ry="2.5" fill="#059669" transform="rotate(-35 82 393)" className="tree-leaf" style={{ animationDelay: '4.5s' } as React.CSSProperties} />
            <ellipse cx="125" cy="398" rx="4" ry="2" fill="#10B981" transform="rotate(-50 125 398)" className="tree-leaf" style={{ animationDelay: '4.7s' } as React.CSSProperties} />
            <ellipse cx="122" cy="516" rx="4.5" ry="2" fill="#34D399" transform="rotate(-30 122 516)" className="tree-leaf" style={{ animationDelay: '4.9s' } as React.CSSProperties} />
            {/* Trunk leaves */}
            <ellipse cx="176" cy="200" rx="4" ry="2" fill="#10B981" transform="rotate(15 176 200)" className="tree-leaf" style={{ animationDelay: '3.3s' } as React.CSSProperties} />
            <ellipse cx="173" cy="340" rx="4.5" ry="2" fill="#34D399" transform="rotate(25 173 340)" className="tree-leaf" style={{ animationDelay: '3.6s' } as React.CSSProperties} />
            <ellipse cx="167" cy="460" rx="4" ry="2" fill="#059669" transform="rotate(10 167 460)" className="tree-leaf" style={{ animationDelay: '4s' } as React.CSSProperties} />
          </g>
        )}

        {/* Gold flower accents */}
        {isVisible && (
          <g>
            <circle cx="90" cy="136" r="3" fill="#D4A017" className="tree-flower" style={{ animationDelay: '4.5s' } as React.CSSProperties} />
            <circle cx="85" cy="270" r="2.5" fill="#E5B829" className="tree-flower" style={{ animationDelay: '4.8s' } as React.CSSProperties} />
            <circle cx="80" cy="390" r="3" fill="#D4A017" className="tree-flower" style={{ animationDelay: '5s' } as React.CSSProperties} />
            <circle cx="120" cy="514" r="2.5" fill="#E5B829" className="tree-flower" style={{ animationDelay: '5.2s' } as React.CSSProperties} />
          </g>
        )}
      </svg>
    </div>
  );
}
