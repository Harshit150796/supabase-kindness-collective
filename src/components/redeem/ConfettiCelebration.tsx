import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiCelebrationProps {
  trigger: boolean;
}

export const ConfettiCelebration = ({ trigger }: ConfettiCelebrationProps) => {
  useEffect(() => {
    if (trigger) {
      // Initial burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#eab308', '#22c55e', '#3b82f6', '#f97316', '#ec4899']
      });

      // Secondary burst after a short delay
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#eab308', '#22c55e', '#3b82f6']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#eab308', '#22c55e', '#3b82f6']
        });
      }, 250);
    }
  }, [trigger]);

  return null;
};
