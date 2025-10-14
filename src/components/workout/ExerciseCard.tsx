import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Play, Zap } from 'lucide-react';
import { SetRowInline } from './SetRowInline';
import { Set } from '@/hooks/useWorkouts';
import { calculateE1RMWithRIR, calculateNextLoad } from '@/lib/algorithms';
import { generateWarmups } from '@/lib/warmupGenerator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ExerciseCardProps {
  exercise: {
    id: string;
    name: string;
    prime_muscle: string;
    video_url?: string;
    is_compound: boolean;
  };
  sets: Set[];
  workoutId: string;
  isActive: boolean;
  canAddSets: boolean;
  onAddSet: (data: {
    load: number;
    reps: number;
    rir: number;
    rpe: number;
    setType: 'warmup' | 'working';
  }) => Promise<void>;
  onExerciseComplete?: () => void;
}

export function ExerciseCard({
  exercise,
  sets,
  workoutId,
  isActive,
  canAddSets,
  onAddSet,
  onExerciseComplete,
}: ExerciseCardProps) {
  const [showWarmups, setShowWarmups] = useState(false);
  const [warmupsCompleted, setWarmupsCompleted] = useState(false);
  
  const workingSets = sets.filter(s => s.set_type === 'working');
  const warmupSets = sets.filter(s => s.set_type === 'warmup');

  const history = workingSets.map(s => ({
    load: s.load,
    completed_reps: s.completed_reps,
    rir_actual: s.rir_actual,
    rpe: s.rpe,
    perceived_pump: s.perceived_pump,
    perceived_soreness: s.perceived_soreness,
    created_at: s.created_at,
  }));

  const suggestion = calculateNextLoad(history);
  const nextSetNumber = workingSets.length + 1;
  
  // Generate suggested warmups if compound and no sets yet
  const suggestedWarmups = 
    exercise.is_compound && workingSets.length === 0 && warmupSets.length === 0
      ? generateWarmups(suggestion.load || 60, true)
      : [];

  const getMuscleColor = (muscle: string) => {
    const colors: Record<string, string> = {
      chest: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
      back: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
      shoulders: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
      biceps: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
      triceps: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20',
      quads: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
      hamstrings: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    };
    return colors[muscle.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
  };

  return (
    <Card className={isActive ? 'border-primary shadow-lg' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">{exercise.name}</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className={getMuscleColor(exercise.prime_muscle)}>
                {exercise.prime_muscle}
              </Badge>
              {exercise.is_compound && (
                <Badge variant="secondary">Compuesto</Badge>
              )}
              <Badge variant="outline">{workingSets.length} sets</Badge>
            </div>
          </div>
          
          {exercise.video_url && (
            <Button variant="outline" size="icon" asChild>
              <a href={exercise.video_url} target="_blank" rel="noopener noreferrer">
                <Play className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Warmup Sets */}
        {warmupSets.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Calentamiento</h4>
            {warmupSets.map((set) => (
              <div key={set.id} className="flex items-center justify-between p-3 border rounded-lg bg-cyan-500/5 border-cyan-500/20">
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20">
                  W
                </Badge>
                <div className="flex gap-4 text-sm">
                  <span className="font-medium">{set.load}kg × {set.completed_reps} reps</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Working Sets */}
        {workingSets.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Series de Trabajo</h4>
            {workingSets.map((set, idx) => (
              <div key={set.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <span className="font-medium">{set.load}kg × {set.completed_reps} reps</span>
                </div>
                <div className="flex gap-2">
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

        {/* Suggested Warmups (Auto-generated) */}
        {suggestedWarmups.length > 0 && !warmupsCompleted && canAddSets && (
          <Collapsible open={showWarmups} onOpenChange={setShowWarmups}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full gap-2">
                <Zap className="h-4 w-4" />
                {showWarmups ? 'Ocultar' : 'Mostrar'} Calentamiento Sugerido ({suggestedWarmups.length} sets)
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {suggestedWarmups.map((warmup, idx) => (
                <SetRowInline
                  key={`warmup-${idx}`}
                  setNumber={idx + 1}
                  setType="warmup"
                  suggestedLoad={warmup.load}
                  suggestedReps={warmup.reps}
                  onComplete={async (data) => {
                    await onAddSet({ ...data, setType: 'warmup' });
                    if (idx === suggestedWarmups.length - 1) {
                      setWarmupsCompleted(true);
                      setShowWarmups(false);
                    }
                  }}
                />
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setWarmupsCompleted(true);
                  setShowWarmups(false);
                }}
              >
                Saltar Calentamiento
              </Button>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Add Set Section */}
        {canAddSets && (
          <div className="space-y-3 pt-4 border-t">
            {suggestion.load > 0 && workingSets.length > 0 && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  Sugerencia próxima serie:
                </p>
                <p className="text-sm">
                  <strong>{suggestion.load}kg × {suggestion.reps} reps</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
              </div>
            )}

            <SetRowInline
              setNumber={nextSetNumber}
              setType="working"
              targetReps={10}
              targetRir={2}
              suggestedLoad={suggestion.load || 20}
              suggestedReps={suggestion.reps}
              onComplete={(data) => onAddSet({ ...data, setType: 'working' })}
            />
          </div>
        )}

        {workingSets.length >= 3 && canAddSets && onExerciseComplete && (
          <Button
            variant="default"
            className="w-full"
            onClick={onExerciseComplete}
          >
            Ejercicio Completado - Dar Feedback
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
