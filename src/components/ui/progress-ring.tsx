import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercentage?: boolean;
  gradient?: {
    from: string;
    to: string;
  };
}

/**
 * Progress Ring circular con gradientes y animaciones suaves
 */
export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  label,
  showPercentage = true,
  gradient = { from: '#667eea', to: '#764ba2' },
}: ProgressRingProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayProgress / 100) * circumference;
  
  useEffect(() => {
    // Animate progress
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
      if (progress >= 100) {
        setTimeout(() => setIsComplete(true), 500);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [progress]);
  
  return (
    <div className="relative inline-flex items-center justify-center">
      {/* SVG Ring */}
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient.from} />
            <stop offset="100%" stopColor={gradient.to} />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          opacity={0.2}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#gradient-${size})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="drop-shadow-lg"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isComplete ? (
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
          >
            <Check className="h-6 w-6 text-white" />
          </motion.div>
        ) : (
          <>
            {showPercentage && (
              <motion.span
                key={displayProgress}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {Math.round(displayProgress)}%
              </motion.span>
            )}
            {label && (
              <span className="text-xs text-muted-foreground mt-1">{label}</span>
            )}
          </>
        )}
      </div>
      
      {/* Glow effect on complete */}
      {isComplete && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-xl"
        />
      )}
    </div>
  );
}

/**
 * Mini Progress Ring para espacios pequeños
 */
export function MiniProgressRing({ progress, size = 40 }: { progress: number; size?: number }) {
  return (
    <ProgressRing
      progress={progress}
      size={size}
      strokeWidth={4}
      showPercentage={false}
    />
  );
}
