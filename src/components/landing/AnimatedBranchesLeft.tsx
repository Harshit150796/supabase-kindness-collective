import { useEffect, useRef, useState } from 'react';

export function AnimatedBranchesLeft() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      <svg
        className="absolute top-0 left-0 w-full h-full"
        viewBox="0 0 1400 1200"
        preserveAspectRatio="xMinYMin slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* === MAIN TRUNK — thick, gnarled, dark bark === */}
        {/* Outer bark layer */}
        <path
          d="M320,80 C310,140 280,200 270,280 C255,380 240,440 220,520 C200,600 180,680 160,760 C140,840 120,900 100,980 C85,1040 70,1100 60,1160"
          stroke="#3E2106"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '0s', animationDuration: '4s' }}
        />
        {/* Inner wood grain layer */}
        <path
          d="M320,80 C310,140 280,200 270,280 C255,380 240,440 220,520 C200,600 180,680 160,760 C140,840 120,900 100,980 C85,1040 70,1100 60,1160"
          stroke="#8B6914"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '0.3s', animationDuration: '4s' }}
        />

        {/* === SECONDARY BRANCH 1 — curves inward to ~30% width === */}
        <path
          d="M270,280 C300,310 340,330 380,360 C410,385 420,410 430,440"
          stroke="#4A2C0A"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
          className={`vine-path sway-branch ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '1s', animationDuration: '3s', transformOrigin: '270px 280px' }}
        />
        <path
          d="M270,280 C300,310 340,330 380,360 C410,385 420,410 430,440"
          stroke="#A0522D"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.35"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '1.2s', animationDuration: '3s' }}
        />

        {/* === SECONDARY BRANCH 2 — longer reach, mid-page === */}
        <path
          d="M220,520 C250,530 290,545 330,560 C370,575 400,580 420,600"
          stroke="#4A2C0A"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
          className={`vine-path sway-branch ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '1.8s', animationDuration: '2.8s', transformOrigin: '220px 520px' }}
        />
        <path
          d="M220,520 C250,530 290,545 330,560 C370,575 400,580 420,600"
          stroke="#8B6914"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '2s', animationDuration: '2.8s' }}
        />

        {/* === SECONDARY BRANCH 3 — lower, drooping === */}
        <path
          d="M160,760 C190,770 230,785 260,810 C290,835 310,870 320,900"
          stroke="#5C4033"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.45"
          className={`vine-path sway-branch-slow ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '2.5s', animationDuration: '2.5s', transformOrigin: '160px 760px' }}
        />
        <path
          d="M160,760 C190,770 230,785 260,810 C290,835 310,870 320,900"
          stroke="#A0522D"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '2.7s', animationDuration: '2.5s' }}
        />

        {/* === DROOPING TWIG 1 — hangs down from trunk === */}
        <path
          d="M240,440 C220,470 200,510 185,550 C170,590 155,620 140,650"
          stroke="#6B4423"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.45"
          className={`vine-path sway-branch-slow ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '1.5s', animationDuration: '2.5s', transformOrigin: '240px 440px' }}
        />

        {/* === THIN TWIG offshoots === */}
        <path
          d="M430,440 C445,455 460,470 470,490"
          stroke="#6B4423"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
          className={`vine-path sway-branch ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '2s', animationDuration: '2s', transformOrigin: '430px 440px' }}
        />
        <path
          d="M420,600 C440,615 455,635 465,660"
          stroke="#5C4033"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
          className={`vine-path sway-branch ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '2.8s', animationDuration: '2s', transformOrigin: '420px 600px' }}
        />
        <path
          d="M320,900 C340,920 355,945 360,970"
          stroke="#6B4423"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.35"
          className={`vine-path sway-branch ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '3.2s', animationDuration: '2s', transformOrigin: '320px 900px' }}
        />

        {/* === HANGING BRANCH — droops from secondary === */}
        <path
          d="M380,360 C370,390 365,420 360,460 C355,490 350,510 345,540"
          stroke="#4A2C0A"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.4"
          className={`vine-path sway-branch-slow ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '2.2s', animationDuration: '2.5s', transformOrigin: '380px 360px' }}
        />

        {/* === KNOTS at branch junctions === */}
        {isVisible && (
          <>
            <circle cx="270" cy="280" r="6" fill="#4A2C0A" opacity="0.5" className="vine-leaf" style={{ animationDelay: '1.5s' }} />
            <circle cx="220" cy="520" r="5" fill="#3E2106" opacity="0.45" className="vine-leaf" style={{ animationDelay: '2.2s' }} />
            <circle cx="160" cy="760" r="5" fill="#5C4033" opacity="0.4" className="vine-leaf" style={{ animationDelay: '3s' }} />
            <circle cx="240" cy="440" r="4" fill="#4A2C0A" opacity="0.4" className="vine-leaf" style={{ animationDelay: '2s' }} />

            {/* === DEAD LEAF silhouettes at branch tips === */}
            <path
              d="M470,490 C475,495 480,492 478,498 C476,504 470,502 468,496 Z"
              fill="#8B7355" opacity="0.45" className="vine-leaf"
              style={{ animationDelay: '2.8s' }}
            />
            <path
              d="M465,660 C470,665 476,662 474,668 C472,674 466,672 464,666 Z"
              fill="#6B4423" opacity="0.4" className="vine-leaf"
              style={{ animationDelay: '3.3s' }}
            />
            <path
              d="M345,540 C350,545 356,542 354,548 C352,554 346,552 344,546 Z"
              fill="#8B7355" opacity="0.4" className="vine-leaf"
              style={{ animationDelay: '3s' }}
            />
            <path
              d="M140,650 C145,656 151,652 148,659 C145,666 139,663 137,656 Z"
              fill="#5C4033" opacity="0.4" className="vine-leaf"
              style={{ animationDelay: '2.5s' }}
            />
            <path
              d="M360,970 C365,975 371,972 369,978 C367,984 361,982 359,976 Z"
              fill="#8B7355" opacity="0.35" className="vine-leaf"
              style={{ animationDelay: '3.8s' }}
            />
            {/* Larger curled dead leaves */}
            <path
              d="M430,438 C438,430 448,432 446,442 C444,452 434,450 430,444 Z"
              fill="#A0522D" opacity="0.35" className="vine-leaf"
              style={{ animationDelay: '2.5s' }}
            />
            <path
              d="M320,898 C328,890 338,892 336,902 C334,912 324,910 320,904 Z"
              fill="#6B4423" opacity="0.35" className="vine-leaf"
              style={{ animationDelay: '3.5s' }}
            />
          </>
        )}
      </svg>
    </div>
  );
}
