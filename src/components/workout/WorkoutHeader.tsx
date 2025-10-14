import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Timer, Check, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface WorkoutHeaderProps {
  workoutTitle: string;
  weekDay: string;
  startTime: Date | null;
  onStart: () => void;
  onFinish: () => void;
  onCancel: () => void;
  totalSets: number;
  completedSets: number;
  isCompleted: boolean;
}

export function WorkoutHeader({
  workoutTitle,
  weekDay,
  startTime,
  onStart,
  onFinish,
  onCancel,
  totalSets,
  completedSets,
  isCompleted,
}: WorkoutHeaderProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{workoutTitle}</h1>
              <p className="text-sm text-muted-foreground">{weekDay}</p>
            </div>
            
            {startTime && (
              <div className="text-right">
                <div className="flex items-center gap-2 text-3xl font-bold">
                  <Timer className="h-8 w-8" />
                  {formatTime(elapsed)}
                </div>
                <p className="text-sm text-muted-foreground">Duración</p>
              </div>
            )}
          </div>

          {startTime && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium">{completedSets} / {totalSets} series</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex gap-2">
                {!isCompleted ? (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          Cancelar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Cancelar entrenamiento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se perderán todas las series registradas en esta sesión.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No, continuar</AlertDialogCancel>
                          <AlertDialogAction onClick={onCancel}>
                            Sí, cancelar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button onClick={onFinish} size="sm" className="gap-2 flex-1">
                      <Check className="h-4 w-4" />
                      Finalizar Entrenamiento
                    </Button>
                  </>
                ) : (
                  <div className="w-full text-center py-2 px-4 bg-primary/10 rounded-lg">
                    <Check className="h-5 w-5 inline mr-2 text-primary" />
                    <span className="font-medium text-primary">Entrenamiento Completado</span>
                  </div>
                )}
              </div>
            </>
          )}

          {!startTime && (
            <Button onClick={onStart} size="lg" className="w-full">
              Iniciar Entrenamiento
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
