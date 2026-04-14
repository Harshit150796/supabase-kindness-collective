import { useEffect, useRef, useState } from 'react';

export function CentralTree() {
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
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-full h-full min-h-[280px] md:min-h-[360px]" style={{ pointerEvents: 'none' }}>
      <svg
        viewBox="0 0 200 500"
        className="w-full h-full max-w-[160px] md:max-w-[200px]"
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'visible' }}
      >
        {/* === ROOTS === */}
        {/* Left dry roots */}
        <path
          d="M100,480 Q80,475 50,485 Q30,490 10,480"
          fill="none"
          stroke="#4A2C0A"
          strokeWidth="5"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '0.5s', animationDuration: '2s' } as React.CSSProperties}
        />
        <path
          d="M100,475 Q75,480 55,490 Q40,495 20,495"
          fill="none"
          stroke="#6B4423"
          strokeWidth="3"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '0.8s', animationDuration: '1.8s' } as React.CSSProperties}
        />
        <path
          d="M100,470 Q85,478 65,478"
          fill="none"
          stroke="#5C3A1E"
          strokeWidth="3.5"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '1s', animationDuration: '1.5s' } as React.CSSProperties}
        />

        {/* Right green roots */}
        <path
          d="M100,480 Q120,475 150,485 Q170,490 190,478"
          fill="none"
          stroke="#059669"
          strokeWidth="5"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '0.5s', animationDuration: '2s' } as React.CSSProperties}
        />
        <path
          d="M100,475 Q125,480 145,490 Q160,495 180,492"
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '0.8s', animationDuration: '1.8s' } as React.CSSProperties}
        />
        <path
          d="M100,470 Q115,478 135,476"
          fill="none"
          stroke="#34D399"
          strokeWidth="3.5"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '1s', animationDuration: '1.5s' } as React.CSSProperties}
        />

        {/* === CENTRAL TRUNK === */}
        {/* Outer bark (dark) */}
        <path
          d="M100,480 Q98,400 97,340 Q96,280 100,220 Q103,160 100,100 Q98,60 100,20"
          fill="none"
          stroke="#3D2106"
          strokeWidth="14"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'tree-trunk-animate' : ''}`}
        />
        {/* Inner wood grain (lighter) */}
        <path
          d="M100,480 Q98,400 97,340 Q96,280 100,220 Q103,160 100,100 Q98,60 100,20"
          fill="none"
          stroke="#6B4423"
          strokeWidth="8"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'tree-trunk-animate' : ''}`}
          style={{ animationDelay: '0.3s' } as React.CSSProperties}
        />
        {/* Highlight grain */}
        <path
          d="M98,470 Q97,380 96,300 Q97,230 100,160 Q101,100 99,40"
          fill="none"
          stroke="#8B6914"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.4"
          className={`vine-path ${isVisible ? 'tree-trunk-animate' : ''}`}
          style={{ animationDelay: '0.6s' } as React.CSSProperties}
        />

        {/* Bark knots */}
        {isVisible && (
          <>
            <circle cx="96" cy="350" r="4" fill="#3D2106" className="vine-leaf" style={{ animationDelay: '2s' } as React.CSSProperties} />
            <circle cx="103" cy="250" r="3" fill="#4A2C0A" className="vine-leaf" style={{ animationDelay: '2.2s' } as React.CSSProperties} />
            <circle cx="97" cy="150" r="3.5" fill="#3D2106" className="vine-leaf" style={{ animationDelay: '2.4s' } as React.CSSProperties} />
          </>
        )}

        {/* === INTERTWINING VINES (DNA helix) === */}
        {/* Brown vine spiraling left */}
        <path
          d="M100,400 Q85,370 100,340 Q115,310 100,280 Q85,250 100,220 Q115,190 100,160"
          fill="none"
          stroke="#5C3A1E"
          strokeWidth="3"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '1.5s', animationDuration: '3s' } as React.CSSProperties}
        />
        {/* Green vine spiraling right */}
        <path
          d="M100,400 Q115,370 100,340 Q85,310 100,280 Q115,250 100,220 Q85,190 100,160"
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '1.8s', animationDuration: '3s' } as React.CSSProperties}
        />

        {/* === LEFT BRANCHES (DECAY) === */}
        {/* Main left branch */}
        <path
          d="M100,120 Q80,100 50,80 Q30,70 5,55"
          fill="none"
          stroke="#4A2C0A"
          strokeWidth="8"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'sway-branch' : ''}`}
          style={{ '--vine-duration': '2s', animationDelay: '1.5s' } as React.CSSProperties}
        />
        {/* Left branch wood grain */}
        <path
          d="M100,120 Q80,100 50,80 Q30,70 5,55"
          fill="none"
          stroke="#6B4423"
          strokeWidth="4"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '1.8s', animationDuration: '2s' } as React.CSSProperties}
        />

        {/* Left sub-branch 1 */}
        <path
          d="M60,85 Q45,60 20,40"
          fill="none"
          stroke="#4A2C0A"
          strokeWidth="5"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'sway-branch-slow' : ''}`}
          style={{ '--vine-duration': '1.5s', animationDelay: '2.2s' } as React.CSSProperties}
        />
        {/* Left sub-branch 2 */}
        <path
          d="M75,95 Q60,75 35,65"
          fill="none"
          stroke="#5C3A1E"
          strokeWidth="4"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'sway-branch' : ''}`}
          style={{ '--vine-duration': '1.5s', animationDelay: '2.5s' } as React.CSSProperties}
        />
        {/* Left twig */}
        <path
          d="M45,75 Q35,55 15,30"
          fill="none"
          stroke="#4A2C0A"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '2.8s', animationDuration: '1.5s' } as React.CSSProperties}
        />
        {/* Left twig 2 */}
        <path
          d="M30,65 Q20,50 5,35"
          fill="none"
          stroke="#5C3A1E"
          strokeWidth="2"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '3s', animationDuration: '1.2s' } as React.CSSProperties}
        />

        {/* Second left branch (lower) */}
        <path
          d="M98,200 Q70,180 40,165 Q20,155 -10,150"
          fill="none"
          stroke="#4A2C0A"
          strokeWidth="6"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'sway-branch-slow' : ''}`}
          style={{ '--vine-duration': '2s', animationDelay: '2s' } as React.CSSProperties}
        />
        <path
          d="M55,172 Q40,155 15,140"
          fill="none"
          stroke="#5C3A1E"
          strokeWidth="3"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '2.8s', animationDuration: '1.5s' } as React.CSSProperties}
        />

        {/* === RIGHT BRANCHES (GROWTH) === */}
        {/* Main right branch */}
        <path
          d="M100,120 Q120,100 150,80 Q170,70 195,55"
          fill="none"
          stroke="#059669"
          strokeWidth="8"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'sway-branch' : ''}`}
          style={{ '--vine-duration': '2s', animationDelay: '1.5s' } as React.CSSProperties}
        />
        {/* Right branch inner */}
        <path
          d="M100,120 Q120,100 150,80 Q170,70 195,55"
          fill="none"
          stroke="#10B981"
          strokeWidth="4"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '1.8s', animationDuration: '2s' } as React.CSSProperties}
        />

        {/* Right sub-branch 1 */}
        <path
          d="M140,85 Q155,60 180,40"
          fill="none"
          stroke="#059669"
          strokeWidth="5"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'sway-branch-slow' : ''}`}
          style={{ '--vine-duration': '1.5s', animationDelay: '2.2s' } as React.CSSProperties}
        />
        {/* Right sub-branch 2 */}
        <path
          d="M125,95 Q140,75 165,65"
          fill="none"
          stroke="#10B981"
          strokeWidth="4"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'sway-branch' : ''}`}
          style={{ '--vine-duration': '1.5s', animationDelay: '2.5s' } as React.CSSProperties}
        />
        {/* Right twig with curl */}
        <path
          d="M155,75 Q165,55 185,35 Q190,25 188,20"
          fill="none"
          stroke="#34D399"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '2.8s', animationDuration: '1.5s' } as React.CSSProperties}
        />
        {/* Right vine tendril */}
        <path
          d="M170,60 Q178,48 182,38 Q185,30 180,28"
          fill="none"
          stroke="#34D399"
          strokeWidth="2"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '3s', animationDuration: '1.2s' } as React.CSSProperties}
        />

        {/* Second right branch (lower) */}
        <path
          d="M102,200 Q130,180 160,165 Q180,155 210,150"
          fill="none"
          stroke="#059669"
          strokeWidth="6"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'sway-branch-slow' : ''}`}
          style={{ '--vine-duration': '2s', animationDelay: '2s' } as React.CSSProperties}
        />
        <path
          d="M145,172 Q160,155 185,140"
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '2.8s', animationDuration: '1.5s' } as React.CSSProperties}
        />

        {/* === LEAVES (right side only - growth) === */}
        {isVisible && (
          <g>
            {/* Leaf shapes - small elongated ovals */}
            <ellipse cx="188" cy="50" rx="6" ry="3" fill="#10B981" transform="rotate(-30 188 50)" className="tree-leaf" style={{ animationDelay: '3.2s' } as React.CSSProperties} />
            <ellipse cx="175" cy="38" rx="5" ry="2.5" fill="#34D399" transform="rotate(-45 175 38)" className="tree-leaf" style={{ animationDelay: '3.4s' } as React.CSSProperties} />
            <ellipse cx="195" cy="60" rx="5" ry="2.5" fill="#059669" transform="rotate(-20 195 60)" className="tree-leaf" style={{ animationDelay: '3.6s' } as React.CSSProperties} />
            <ellipse cx="165" cy="62" rx="5" ry="2.5" fill="#10B981" transform="rotate(-50 165 62)" className="tree-leaf" style={{ animationDelay: '3.8s' } as React.CSSProperties} />
            <ellipse cx="183" cy="35" rx="4" ry="2" fill="#34D399" transform="rotate(-60 183 35)" className="tree-leaf" style={{ animationDelay: '4s' } as React.CSSProperties} />
            <ellipse cx="145" cy="80" rx="5" ry="2.5" fill="#10B981" transform="rotate(-35 145 80)" className="tree-leaf" style={{ animationDelay: '4.1s' } as React.CSSProperties} />
            <ellipse cx="200" cy="148" rx="5" ry="2.5" fill="#059669" transform="rotate(-15 200 148)" className="tree-leaf" style={{ animationDelay: '4.2s' } as React.CSSProperties} />
            <ellipse cx="180" cy="140" rx="4" ry="2" fill="#34D399" transform="rotate(-40 180 140)" className="tree-leaf" style={{ animationDelay: '4.3s' } as React.CSSProperties} />
            <ellipse cx="160" cy="160" rx="5" ry="2.5" fill="#10B981" transform="rotate(-25 160 160)" className="tree-leaf" style={{ animationDelay: '4.4s' } as React.CSSProperties} />

            {/* Additional leaves on the trunk area (right side) */}
            <ellipse cx="112" cy="170" rx="4" ry="2" fill="#10B981" transform="rotate(20 112 170)" className="tree-leaf" style={{ animationDelay: '3.5s' } as React.CSSProperties} />
            <ellipse cx="108" cy="130" rx="4.5" ry="2" fill="#34D399" transform="rotate(30 108 130)" className="tree-leaf" style={{ animationDelay: '3.7s' } as React.CSSProperties} />
          </g>
        )}

        {/* === FLOWERS / BLOSSOMS (gold accents at branch tips) === */}
        {isVisible && (
          <g>
            <circle cx="195" cy="55" r="4" fill="#D4A017" className="tree-flower" style={{ animationDelay: '4s' } as React.CSSProperties} />
            <circle cx="180" cy="40" r="3" fill="#E5B829" className="tree-flower" style={{ animationDelay: '4.2s' } as React.CSSProperties} />
            <circle cx="185" cy="30" r="2.5" fill="#D4A017" className="tree-flower" style={{ animationDelay: '4.4s' } as React.CSSProperties} />
            <circle cx="170" cy="65" r="3" fill="#E5B829" className="tree-flower" style={{ animationDelay: '4.6s' } as React.CSSProperties} />
            <circle cx="210" cy="150" r="3.5" fill="#D4A017" className="tree-flower" style={{ animationDelay: '4.8s' } as React.CSSProperties} />
            <circle cx="188" cy="135" r="2.5" fill="#E5B829" className="tree-flower" style={{ animationDelay: '5s' } as React.CSSProperties} />
          </g>
        )}

        {/* === DEAD LEAF SILHOUETTES (left side) === */}
        {isVisible && (
          <g>
            <path d="M20,38 Q15,32 18,26 Q22,30 25,28 Q22,34 20,38Z" fill="#4A2C0A" opacity="0.5" className="vine-leaf" style={{ animationDelay: '3.5s' } as React.CSSProperties} />
            <path d="M10,52 Q5,46 8,40 Q12,44 15,42 Q12,48 10,52Z" fill="#5C3A1E" opacity="0.4" className="vine-leaf" style={{ animationDelay: '3.8s' } as React.CSSProperties} />
            <path d="M35,62 Q30,56 33,50 Q37,54 40,52 Q37,58 35,62Z" fill="#4A2C0A" opacity="0.45" className="vine-leaf" style={{ animationDelay: '4s' } as React.CSSProperties} />
            <path d="M-5,148 Q-10,142 -7,136 Q-3,140 0,138 Q-3,144 -5,148Z" fill="#5C3A1E" opacity="0.4" className="vine-leaf" style={{ animationDelay: '4.2s' } as React.CSSProperties} />
            <path d="M20,138 Q15,132 18,126 Q22,130 25,128 Q22,134 20,138Z" fill="#4A2C0A" opacity="0.5" className="vine-leaf" style={{ animationDelay: '4.4s' } as React.CSSProperties} />
          </g>
        )}

        {/* === "We're changing this" label === */}
        <text x="100" y="430" textAnchor="middle" fill="hsl(160, 10%, 40%)" fontSize="9" fontWeight="500" className={isVisible ? 'animate-fade-in' : 'opacity-0'} style={{ animationDelay: '2.5s' } as React.CSSProperties}>
          We're changing this
        </text>
      </svg>
    </div>
  );
}
