import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTodayWorkout, useWorkoutSets, useCompleteWorkout } from '@/hooks/useWorkouts';
import { useExercises } from '@/hooks/useExercises';
import { AddSetDialog } from '@/components/workout/AddSetDialog';
import { Loader2, Dumbbell, Check, Timer } from 'lucide-react';
import { calculateNextLoad, calculateE1RMWithRIR } from '@/lib/algorithms';
import { useState as useStateTimer, useEffect } from 'react';

export default function TodayWorkout() {
  const { data: workout, isLoading } = useTodayWorkout();
  const { data: allSets } = useWorkoutSets(workout?.id || '');
  const { data: exercises } = useExercises();
  const completeWorkout = useCompleteWorkout();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);

  const handleStart = () => {
    setStartTime(new Date());
  };

  const handleComplete = async () => {
    if (!workout || !startTime) return;
    
    const duration = Math.floor((Date.now() - startTime.getTime()) / 60000);
    await completeWorkout.mutateAsync({ workoutId: workout.id, duration });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!workout) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No hay entrenamiento programado para hoy</h2>
              <p className="text-muted-foreground">Crea un nuevo mesociclo para comenzar</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Group sets by exercise
  const exerciseGroups = exercises?.reduce((acc, exercise) => {
    const sets = allSets?.filter(s => s.exercise_id === exercise.id) || [];
    if (sets.length > 0 || true) { // Show all exercises
      acc[exercise.id] = { exercise, sets };
    }
    return acc;
  }, {} as Record<string, { exercise: any; sets: any[] }>) || {};

  const totalSets = allSets?.length || 0;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Entrenamiento de Hoy</CardTitle>
                <Badge className="mt-2">{workout.status}</Badge>
              </div>
              
              {startTime && (
                <div className="text-right">
                  <div className="flex items-center gap-2 text-2xl font-bold">
                    <Timer className="h-6 w-6" />
                    {formatTime(elapsed)}
                  </div>
                  <p className="text-sm text-muted-foreground">Duración</p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Series completadas</p>
                <p className="text-2xl font-bold">{totalSets}</p>
              </div>
              
              {!startTime ? (
                <Button onClick={handleStart} size="lg">
                  Iniciar Entrenamiento
                </Button>
              ) : workout.status !== 'completed' ? (
                <Button onClick={handleComplete} size="lg" variant="default">
                  <Check className="mr-2 h-4 w-4" />
                  Finalizar Entrenamiento
                </Button>
              ) : (
                <Badge variant="default" className="text-lg px-4 py-2">
                  <Check className="mr-2 h-5 w-5" />
                  Completado
                </Badge>
              )}
            </div>

            <Accordion type="single" collapsible className="w-full">
              {Object.values(exerciseGroups).map(({ exercise, sets }) => {
                const history = sets.map(s => ({
                  load: s.load,
                  completed_reps: s.completed_reps,
                  rir_actual: s.rir_actual,
                  rpe: s.rpe,
                  perceived_pump: s.perceived_pump,
                  perceived_soreness: s.perceived_soreness,
                  created_at: s.created_at,
                }));
                
                const suggestion = calculateNextLoad(history);
                const nextSetNumber = sets.length + 1;

                return (
                  <AccordionItem key={exercise.id} value={exercise.id}>
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-semibold">{exercise.name}</span>
                        <Badge variant="secondary">{sets.length} sets</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {sets.length > 0 && (
                          <div className="space-y-2">
                            {sets.map((set, idx) => (
                              <div key={set.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <span className="font-medium">Set {set.set_number}</span>
                                <div className="flex gap-4 text-sm">
                                  <span>{set.load}kg × {set.completed_reps} reps</span>
                                  <Badge variant="outline">RIR {set.rir_actual}</Badge>
                                  <Badge variant="outline">RPE {set.rpe}</Badge>
                                  <Badge variant="secondary">
                                    e1RM: {calculateE1RMWithRIR(set.load, set.completed_reps, set.rir_actual)}kg
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {startTime && workout.status !== 'completed' && (
                          <div className="space-y-2">
                            {suggestion.load > 0 && (
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm font-medium mb-1">Sugerencia próxima serie:</p>
                                <p className="text-sm text-muted-foreground">
                                  {suggestion.load}kg × {suggestion.reps} reps - {suggestion.reason}
                                </p>
                              </div>
                            )}
                            
                            <AddSetDialog
                              workoutId={workout.id}
                              exercise={exercise}
                              setNumber={nextSetNumber}
                              suggestedLoad={suggestion.load || 20}
                              suggestedReps={suggestion.reps}
                            />
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
