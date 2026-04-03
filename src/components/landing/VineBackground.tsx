import { useEffect, useRef, useState } from 'react';

export function VineBackground() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
        setScrollProgress(progress);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const totalLength = 2000;
  const visibleLength = scrollProgress * totalLength;
  const dashOffset = totalLength - visibleLength;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      <svg
        className="w-full h-full"
        viewBox="0 0 1440 3000"
        preserveAspectRatio="xMidYMin slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left vine - main branch */}
        <path
          d="M 720 180 C 600 300, 200 400, 120 600 C 60 780, 80 900, 100 1100 C 120 1300, 60 1500, 80 1700 C 100 1900, 50 2100, 70 2400 C 85 2600, 60 2700, 80 2900"
          stroke="hsl(160 84% 22%)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.2"
          strokeDasharray={totalLength}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
        />

        {/* Left vine - secondary branch */}
        <path
          d="M 120 600 C 150 650, 180 620, 160 580"
          stroke="hsl(160 84% 22%)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity={scrollProgress > 0.1 ? 0.18 : 0}
          style={{ transition: 'opacity 0.5s ease-out' }}
        />
        <path
          d="M 100 1100 C 130 1060, 170 1080, 150 1130 C 130 1160, 90 1140, 100 1100"
          stroke="hsl(160 84% 22%)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity={scrollProgress > 0.25 ? 0.18 : 0}
          style={{ transition: 'opacity 0.5s ease-out' }}
        />
        <path
          d="M 80 1700 C 110 1660, 150 1690, 130 1730"
          stroke="hsl(160 84% 22%)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity={scrollProgress > 0.45 ? 0.18 : 0}
          style={{ transition: 'opacity 0.5s ease-out' }}
        />

        {/* Right vine - main branch */}
        <path
          d="M 720 180 C 840 300, 1240 400, 1320 600 C 1380 780, 1360 900, 1340 1100 C 1320 1300, 1380 1500, 1360 1700 C 1340 1900, 1390 2100, 1370 2400 C 1355 2600, 1380 2700, 1360 2900"
          stroke="hsl(160 84% 22%)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.2"
          strokeDasharray={totalLength}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
        />

        {/* Right vine - secondary branches */}
        <path
          d="M 1320 600 C 1290 650, 1260 620, 1280 580"
          stroke="hsl(160 84% 22%)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity={scrollProgress > 0.1 ? 0.18 : 0}
          style={{ transition: 'opacity 0.5s ease-out' }}
        />
        <path
          d="M 1340 1100 C 1310 1060, 1270 1080, 1290 1130 C 1310 1160, 1350 1140, 1340 1100"
          stroke="hsl(160 84% 22%)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity={scrollProgress > 0.25 ? 0.18 : 0}
          style={{ transition: 'opacity 0.5s ease-out' }}
        />
        <path
          d="M 1360 1700 C 1330 1660, 1290 1690, 1310 1730"
          stroke="hsl(160 84% 22%)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity={scrollProgress > 0.45 ? 0.18 : 0}
          style={{ transition: 'opacity 0.5s ease-out' }}
        />

        {/* Leaves - left side */}
        <ellipse
          cx="115" cy="750"
          rx="6" ry="12"
          transform="rotate(-30 115 750)"
          fill="hsl(160 84% 22%)"
          opacity={scrollProgress > 0.15 ? 0.15 : 0}
          style={{ transition: 'opacity 0.6s ease-out' }}
        />
        <ellipse
          cx="90" cy="1300"
          rx="5" ry="10"
          transform="rotate(20 90 1300)"
          fill="hsl(160 84% 22%)"
          opacity={scrollProgress > 0.35 ? 0.15 : 0}
          style={{ transition: 'opacity 0.6s ease-out' }}
        />
        <ellipse
          cx="75" cy="2000"
          rx="6" ry="11"
          transform="rotate(-15 75 2000)"
          fill="hsl(160 84% 22%)"
          opacity={scrollProgress > 0.55 ? 0.15 : 0}
          style={{ transition: 'opacity 0.6s ease-out' }}
        />

        {/* Leaves - right side */}
        <ellipse
          cx="1325" cy="750"
          rx="6" ry="12"
          transform="rotate(30 1325 750)"
          fill="hsl(160 84% 22%)"
          opacity={scrollProgress > 0.15 ? 0.15 : 0}
          style={{ transition: 'opacity 0.6s ease-out' }}
        />
        <ellipse
          cx="1350" cy="1300"
          rx="5" ry="10"
          transform="rotate(-20 1350 1300)"
          fill="hsl(160 84% 22%)"
          opacity={scrollProgress > 0.35 ? 0.15 : 0}
          style={{ transition: 'opacity 0.6s ease-out' }}
        />
        <ellipse
          cx="1375" cy="2000"
          rx="6" ry="11"
          transform="rotate(15 1375 2000)"
          fill="hsl(160 84% 22%)"
          opacity={scrollProgress > 0.55 ? 0.15 : 0}
          style={{ transition: 'opacity 0.6s ease-out' }}
        />

        {/* Tiny flowers - gold accent */}
        <circle
          cx="105" cy="950"
          r="4"
          fill="hsl(45 93% 47%)"
          opacity={scrollProgress > 0.2 ? 0.2 : 0}
          style={{ transition: 'opacity 0.6s ease-out' }}
        />
        <circle
          cx="108" cy="950"
          r="3"
          fill="white"
          opacity={scrollProgress > 0.2 ? 0.15 : 0}
          style={{ transition: 'opacity 0.6s ease-out' }}
        />

        <circle
          cx="1335" cy="950"
          r="4"
          fill="hsl(45 93% 47%)"
          opacity={scrollProgress > 0.2 ? 0.2 : 0}
          style={{ transition: 'opacity 0.6s ease-out' }}
        />
        <circle
          cx="1332" cy="950"
          r="3"
          fill="white"
          opacity={scrollProgress > 0.2 ? 0.15 : 0}
          style={{ transition: 'opacity 0.6s ease-out' }}
        />

        {/* More flowers lower */}
        <circle
          cx="85" cy="1900"
          r="3.5"
          fill="hsl(45 93% 47%)"
          opacity={scrollProgress > 0.5 ? 0.2 : 0}
          style={{ transition: 'opacity 0.6s ease-out' }}
        />
        <circle
          cx="1355" cy="1900"
          r="3.5"
          fill="hsl(45 93% 47%)"
          opacity={scrollProgress > 0.5 ? 0.2 : 0}
          style={{ transition: 'opacity 0.6s ease-out' }}
        />
      </svg>
    </div>
  );
}
