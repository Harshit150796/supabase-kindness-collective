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
      { threshold: 0.1 }
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
        {/* Main trunk - thick, gnarled branch from top-left */}
        <path
          d="M80,280 C90,320 70,380 85,440 C100,500 60,560 75,640 C90,720 55,780 70,850 C85,920 65,960 80,1020"
          stroke="#6B4423"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.3"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '0s', animationDuration: '3.5s' }}
        />

        {/* Secondary branch - curves inward slightly */}
        <path
          d="M60,350 C80,400 120,420 100,480 C80,540 110,580 95,650 C80,720 100,760 90,830"
          stroke="#8B6914"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.25"
          className={`vine-path ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '0.5s', animationDuration: '3s' }}
        />

        {/* Thin offshoot branch 1 */}
        <path
          d="M85,440 C110,450 130,430 150,445 C170,460 165,480 175,490"
          stroke="#A0522D"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.2"
          className={`vine-path sway-branch ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '1.2s', animationDuration: '2.5s', transformOrigin: '85px 440px' }}
        />

        {/* Thin offshoot branch 2 */}
        <path
          d="M75,640 C100,635 125,650 140,640 C155,630 170,645 180,638"
          stroke="#5C4033"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.2"
          className={`vine-path sway-branch ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '1.8s', animationDuration: '2.5s', transformOrigin: '75px 640px' }}
        />

        {/* Drooping twig 1 */}
        <path
          d="M70,520 C50,540 35,560 25,590 C15,620 20,640 15,660"
          stroke="#6B4423"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.18"
          className={`vine-path sway-branch-slow ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '1s', animationDuration: '2.8s', transformOrigin: '70px 520px' }}
        />

        {/* Curling root tendril */}
        <path
          d="M90,850 C110,870 130,860 145,880 C160,900 150,920 160,940"
          stroke="#8B6914"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.2"
          className={`vine-path sway-branch ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '2.2s', animationDuration: '2.5s', transformOrigin: '90px 850px' }}
        />

        {/* Another thin wispy branch */}
        <path
          d="M95,750 C115,740 135,755 155,745 C175,735 185,750 200,742"
          stroke="#A0522D"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.15"
          className={`vine-path sway-branch-slow ${isVisible ? 'vine-animate' : ''}`}
          style={{ animationDelay: '2.5s', animationDuration: '2.5s', transformOrigin: '95px 750px' }}
        />

        {/* Small dead leaf shapes as tiny circles */}
        {isVisible && (
          <>
            <circle cx="150" cy="445" r="3" fill="#6B4423" opacity="0.15" className="vine-leaf" style={{ animationDelay: '2s' }} />
            <circle cx="140" cy="640" r="2.5" fill="#8B6914" opacity="0.12" className="vine-leaf" style={{ animationDelay: '2.5s' }} />
            <circle cx="15" cy="660" r="2" fill="#5C4033" opacity="0.12" className="vine-leaf" style={{ animationDelay: '2.2s' }} />
            <circle cx="160" cy="940" r="3" fill="#A0522D" opacity="0.15" className="vine-leaf" style={{ animationDelay: '3s' }} />
            <circle cx="200" cy="742" r="2.5" fill="#6B4423" opacity="0.12" className="vine-leaf" style={{ animationDelay: '3.2s' }} />
          </>
        )}
      </svg>
    </div>
  );
}
