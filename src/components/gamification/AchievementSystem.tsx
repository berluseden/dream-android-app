import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Trophy, Target, Flame, Award, Star, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Achievement {
  id: string;
  icon: 'trophy' | 'target' | 'flame' | 'award' | 'star' | 'zap';
  title: string;
  description: string;
  color: string;
}

const iconMap = {
  trophy: Trophy,
  target: Target,
  flame: Flame,
  award: Award,
  star: Star,
  zap: Zap,
};

/**
 * Sistema de logros con animaciones de celebración
 * Gamificación para motivar al usuario
 */
export function AchievementUnlocked({ achievement }: { achievement: Achievement }) {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = iconMap[achievement.icon];
  
  useEffect(() => {
    // Confetti explosion
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: [achievement.color, '#FFD700', '#FFA500'],
    });
    
    // Auto-hide after 5 seconds
    const timer = setTimeout(() => setIsVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [achievement]);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, rotate: -180, y: 100 }}
          animate={{ scale: 1, rotate: 0, y: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="glass-card p-6 min-w-[300px]">
            {/* Sparkles background */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * 300, 
                    y: Math.random() * 200,
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: Math.random() * 0.5,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2,
                  }}
                  className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                  style={{
                    boxShadow: '0 0 10px rgba(250, 204, 21, 0.8)',
                  }}
                />
              ))}
            </div>
            
            {/* Content */}
            <div className="relative flex items-center gap-4">
              {/* Icon */}
              <motion.div
                animate={{
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
                className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${achievement.color}, ${achievement.color}dd)` }}
              >
                <Icon className="h-8 w-8 text-white" />
              </motion.div>
              
              {/* Text */}
              <div className="flex-1">
                <motion.h3
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="font-bold text-lg"
                >
                  ¡Logro Desbloqueado!
                </motion.h3>
                <motion.p
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="font-semibold text-foreground"
                >
                  {achievement.title}
                </motion.p>
                <motion.p
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-muted-foreground"
                >
                  {achievement.description}
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook para mostrar logros
 */
export function useAchievements() {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  
  const unlockAchievement = (achievement: Achievement) => {
    setCurrentAchievement(achievement);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
    
    // Clear after animation
    setTimeout(() => setCurrentAchievement(null), 5500);
  };
  
  return {
    unlockAchievement,
    AchievementDisplay: currentAchievement ? (
      <AchievementUnlocked achievement={currentAchievement} />
    ) : null,
  };
}

/**
 * Ejemplos de logros predefinidos
 */
export const sampleAchievements: Achievement[] = [
  {
    id: '1st-workout',
    icon: 'trophy',
    title: 'Primera Victoria',
    description: '¡Completaste tu primer entrenamiento!',
    color: '#FFD700',
  },
  {
    id: '7-day-streak',
    icon: 'flame',
    title: 'Racha de Fuego',
    description: '7 días consecutivos entrenando',
    color: '#FF6B6B',
  },
  {
    id: 'pr-squat',
    icon: 'zap',
    title: 'Nueva Marca',
    description: '¡Record personal en sentadilla!',
    color: '#667eea',
  },
  {
    id: '100-sets',
    icon: 'target',
    title: 'Centurión',
    description: '100 series completadas',
    color: '#11998e',
  },
];
