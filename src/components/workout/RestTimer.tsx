import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer, Play, Pause, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RestTimerProps {
  targetSeconds: number;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function RestTimer({ targetSeconds = 180, onComplete, onSkip }: RestTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (next >= targetSeconds) {
            setIsRunning(false);
            onComplete?.();
          }
          return next;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, targetSeconds, onComplete]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const progress = (seconds / targetSeconds) * 100;
  const isComplete = seconds >= targetSeconds;

  const startTimer = () => {
    setSeconds(0);
    setIsRunning(true);
    setIsVisible(true);
  };

  const togglePause = () => {
    setIsRunning(!isRunning);
  };

  const handleSkip = () => {
    setSeconds(0);
    setIsRunning(false);
    setIsVisible(false);
    onSkip?.();
  };

  if (!isVisible) {
    return (
      <Button
        onClick={startTimer}
        variant="outline"
        className="gap-2"
        size="sm"
      >
        <Timer className="h-4 w-4" />
        Iniciar Descanso
      </Button>
    );
  }

  return (
    <Card className={cn(
      "border-2 transition-colors",
      isComplete ? "border-green-500 bg-green-500/5" : "border-primary"
    )}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className={cn(
                "h-5 w-5",
                isComplete && "text-green-500"
              )} />
              <span className="text-sm font-medium">
                {isComplete ? '¡Descanso completo!' : 'Descanso'}
              </span>
            </div>
            
            <div className={cn(
              "text-2xl font-bold tabular-nums",
              isComplete && "text-green-500"
            )}>
              {formatTime(seconds)} / {formatTime(targetSeconds)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-1000",
                isComplete ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={togglePause}
              variant="outline"
              size="sm"
              className="gap-2 flex-1"
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Reanudar
                </>
              )}
            </Button>
            
            <Button
              onClick={handleSkip}
              variant="secondary"
              size="sm"
              className="gap-2 flex-1"
            >
              <SkipForward className="h-4 w-4" />
              Omitir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
