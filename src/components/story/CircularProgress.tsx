import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularProgress({ 
  value, 
  size = 120, 
  strokeWidth = 8,
  className 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  const isComplete = value >= 100;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isComplete ? "hsl(var(--primary))" : "hsl(var(--primary))"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: isComplete ? 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))' : undefined
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn(
          "text-2xl font-bold",
          isComplete ? "text-primary" : "text-foreground"
        )}>
          {Math.min(Math.round(value), 100)}%
        </span>
        <span className="text-xs text-muted-foreground">funded</span>
      </div>
    </div>
  );
}
