import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import confetti from 'canvas-confetti';

interface WorkoutTimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

const motivationalQuotes = [
  "💪 Cada rep cuenta",
  "🔥 Empuja tus límites",
  "⚡ Eres más fuerte de lo que crees",
  "🎯 Enfócate en la meta",
  "🚀 Un paso más cerca",
  "💎 Forjando fuerza",
  "🦾 Domina el dolor",
  "⭐ Hazlo por ti",
];

/**
 * Timer inmersivo para descansos entre series
 * Con breathing animations, sonido y celebración al completar
 */
export function WorkoutTimer({ 
  initialSeconds = 90, 
  onComplete,
  autoStart = false 
}: WorkoutTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0]);
  
  // Breathing animation state
  const breatheIn = timeLeft % 8 < 4;
  
  // Random quote every 10 seconds
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        setCurrentQuote(randomQuote);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isRunning]);
  
  // Timer logic
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        
        // Sound at 10, 5, 3, 2, 1 seconds
        if (isSoundEnabled && [10, 5, 3, 2, 1].includes(prev - 1)) {
          playBeep(prev - 1 === 1 ? 'high' : 'low');
        }
        
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isSoundEnabled]);
  
  const handleComplete = useCallback(() => {
    setIsRunning(false);
    if (isSoundEnabled) playBeep('complete');
    
    // Confetti celebration!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Haptic feedback (if supported)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    
    onComplete?.();
  }, [isSoundEnabled, onComplete]);
  
  const playBeep = (type: 'low' | 'high' | 'complete') => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = type === 'high' ? 800 : type === 'complete' ? 1000 : 400;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };
  
  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setTimeLeft(initialSeconds);
    setIsRunning(false);
  };
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((initialSeconds - timeLeft) / initialSeconds) * 100;
  
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 border-2">
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20"
          animate={{
            scale: breatheIn ? 1.05 : 1,
            opacity: breatheIn ? 0.6 : 0.3,
          }}
          transition={{ duration: 4, ease: "easeInOut" }}
        />
        
        {/* Content */}
        <div className="relative p-8 flex flex-col items-center gap-6">
          {/* Motivational quote */}
          <AnimatePresence mode="wait">
            <motion.p
              key={currentQuote}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-lg font-medium text-center text-muted-foreground"
            >
              {currentQuote}
            </motion.p>
          </AnimatePresence>
          
          {/* Circular progress timer */}
          <div className="relative">
            {/* Progress circle */}
            <svg width="240" height="240" className="transform -rotate-90">
              <defs>
                <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
              
              {/* Background circle */}
              <circle
                cx="120"
                cy="120"
                r="110"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="12"
                opacity={0.2}
              />
              
              {/* Progress circle with breathing effect */}
              <motion.circle
                cx="120"
                cy="120"
                r="110"
                fill="none"
                stroke="url(#timer-gradient)"
                strokeWidth="12"
                strokeDasharray={691.15} // 2 * PI * 110
                strokeDashoffset={691.15 * (1 - progress / 100)}
                strokeLinecap="round"
                animate={{
                  strokeWidth: breatheIn ? 14 : 12,
                }}
                transition={{ duration: 4, ease: "easeInOut" }}
                className="drop-shadow-lg"
              />
            </svg>
            
            {/* Timer display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: breatheIn ? 1.05 : 1,
                }}
                transition={{ duration: 4, ease: "easeInOut" }}
                className="text-center"
              >
                <div className="text-6xl font-bold tabular-nums bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {timeLeft === 0 ? '¡Listo!' : isRunning ? 'Descansando...' : 'En pausa'}
                </p>
              </motion.div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleTimer}
              size="lg"
              className="btn-gradient gap-2"
              disabled={timeLeft === 0}
            >
              {isRunning ? (
                <>
                  <Pause className="h-5 w-5" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  {timeLeft === initialSeconds ? 'Iniciar' : 'Continuar'}
                </>
              )}
            </Button>
            
            <Button
              onClick={resetTimer}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <RotateCcw className="h-5 w-5" />
              Reiniciar
            </Button>
            
            <Button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              variant="ghost"
              size="icon"
            >
              {isSoundEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          {/* Breathing instruction */}
          <motion.p
            animate={{
              opacity: isRunning ? [0.5, 1, 0.5] : 0.5,
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="text-sm text-muted-foreground text-center"
          >
            {breatheIn ? '🫁 Inhala profundo...' : '😮‍💨 Exhala lento...'}
          </motion.p>
        </div>
      </Card>
    </motion.div>
  );
}
