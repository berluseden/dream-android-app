import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useTodayWorkout, useWorkoutSets, useCompleteWorkout, useAddSet } from '@/hooks/useWorkouts';
import { useExercises } from '@/hooks/useExercises';
import { useAddExerciseFeedback } from '@/hooks/useExerciseFeedback';
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import { ExerciseThumbnailCarousel } from '@/components/workout/ExerciseThumbnailCarousel';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { FeedbackDialog } from '@/components/workout/FeedbackDialog';
import { RestTimer } from '@/components/workout/RestTimer';
import { PageTransition, FadeIn } from '@/components/layout/PageTransition';
import { Loader2, Dumbbell, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function TodayWorkout() {
  const navigate = useNavigate();
  const { data: workout, isLoading } = useTodayWorkout();
  const { data: allSets } = useWorkoutSets(workout?.id || '');
  const { data: exercises } = useExercises();
  const completeWorkout = useCompleteWorkout();
  const addSet = useAddSet();
  const addFeedback = useAddExerciseFeedback();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string>('');
  const [feedbackDialog, setFeedbackDialog] = useState<{
    open: boolean;
    exerciseId: string;
    exerciseName: string;
    muscleName: string;
  }>({ open: false, exerciseId: '', exerciseName: '', muscleName: '' });
  const [showRestTimer, setShowRestTimer] = useState(false);

  const handleStart = () => {
    setStartTime(new Date());
    if (exercises && exercises.length > 0) {
      setActiveExerciseId(exercises[0].id);
    }
  };

  const handleComplete = async () => {
    if (!workout || !startTime) return;
    
    const duration = Math.floor((Date.now() - startTime.getTime()) / 60000);
    await completeWorkout.mutateAsync({ workoutId: workout.id, duration });
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleAddSet = async (
    exerciseId: string,
    data: {
      load: number;
      reps: number;
      rir: number;
      rpe: number;
      setType: 'warmup' | 'working';
    }
  ) => {
    if (!workout) return;

    const exerciseSets = allSets?.filter(s => s.exercise_id === exerciseId) || [];
    const setNumber = exerciseSets.length + 1;

    await addSet.mutateAsync({
      workout_id: workout.id,
      exercise_id: exerciseId,
      set_number: setNumber,
      set_type: data.setType,
      target_reps: 10,
      rir_target: 2,
      load: data.load,
      completed_reps: data.reps,
      rir_actual: data.rir,
      rpe: data.rpe,
      perceived_pump: 5,
      perceived_soreness: 5,
      notes: '',
    });

    if (data.setType === 'working') {
      setShowRestTimer(true);
    }
  };

  const handleExerciseComplete = (exerciseId: string, exerciseName: string, muscleName: string) => {
    setFeedbackDialog({
      open: true,
      exerciseId,
      exerciseName,
      muscleName,
    });
  };

  const handleFeedbackSubmit = async (feedback: {
    muscle_soreness: 'never_sore' | 'healed_while_ago' | 'just_on_time' | 'still_sore';
    pump_quality: 'low' | 'moderate' | 'amazing';
    workload_feeling: 'easy' | 'pretty_good' | 'pushed_limits' | 'too_much';
    notes?: string;
  }) => {
    if (!workout) return;

    await addFeedback.mutateAsync({
      workout_id: workout.id,
      exercise_id: feedbackDialog.exerciseId,
      ...feedback,
    });

    // Move to next exercise
    const currentIndex = exercises?.findIndex(e => e.id === feedbackDialog.exerciseId);
    if (currentIndex !== undefined && currentIndex < (exercises?.length || 0) - 1) {
      setActiveExerciseId(exercises![currentIndex + 1].id);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <PageTransition>
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Flame className="h-12 w-12 text-primary" />
            </motion.div>
            <p className="mt-4 text-muted-foreground">Preparando tu entrenamiento...</p>
          </div>
        </PageTransition>
      </AppLayout>
    );
  }

  if (!workout) {
    return (
      <AppLayout>
        <PageTransition>
          <div className="container mx-auto p-6">
            <FadeIn>
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Dumbbell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">No hay entrenamiento programado para hoy</h2>
                  <p className="text-muted-foreground">Crea un nuevo mesociclo para comenzar tu viaje 💪</p>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </PageTransition>
      </AppLayout>
    );
  }

  // Prepare exercise thumbnails
  const exerciseThumbnails = exercises?.map(ex => {
    const sets = allSets?.filter(s => s.exercise_id === ex.id) || [];
    const workingSets = sets.filter(s => s.set_type === 'working');
    return {
      id: ex.id,
      name: ex.name,
      completedSets: workingSets.length,
      totalSets: 3, // default target
      muscleGroup: ex.prime_muscle,
    };
  }) || [];

  const totalSets = allSets?.filter(s => s.set_type === 'working').length || 0;
  const targetTotalSets = (exercises?.length || 0) * 3;

  return (
    <AppLayout>
      <PageTransition>
        <div className="container mx-auto p-6 space-y-6">
          {/* Header moderno con gradiente */}
          <FadeIn delay={0}>
            <div className="relative overflow-hidden rounded-2xl mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10" />
              <div className="relative glass-card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Flame className="h-6 w-6 text-orange-500" />
                  <h1 className="text-3xl font-bold">
                    <span className="neon-text">Entrenamiento de Hoy</span>
                  </h1>
                </div>
                <p className="text-muted-foreground">
                  {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <WorkoutHeader
              workoutTitle="Entrenamiento de Hoy"
              weekDay={new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
              startTime={startTime}
              onStart={handleStart}
              onFinish={handleComplete}
              onCancel={handleCancel}
              totalSets={targetTotalSets}
              completedSets={totalSets}
              isCompleted={workout.status === 'completed'}
            />
          </FadeIn>

          {startTime && (
            <>
              <FadeIn delay={0.2}>
                <ExerciseThumbnailCarousel
                  exercises={exerciseThumbnails}
                  activeExerciseId={activeExerciseId}
                  onExerciseClick={setActiveExerciseId}
                />
              </FadeIn>

              {showRestTimer && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <RestTimer
                    targetSeconds={180}
                    onComplete={() => setShowRestTimer(false)}
                    onSkip={() => setShowRestTimer(false)}
                  />
                </motion.div>
              )}
            </>
          )}

          <div className="space-y-4">
            {exercises?.map((exercise, index) => {
              const sets = allSets?.filter(s => s.exercise_id === exercise.id) || [];
              const isActive = exercise.id === activeExerciseId;
              
              return (
                <FadeIn key={exercise.id} delay={0.3 + index * 0.05}>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <ExerciseCard
                      exercise={exercise}
                      sets={sets}
                      workoutId={workout.id}
                      isActive={isActive}
                      canAddSets={!!startTime && workout.status !== 'completed'}
                      onAddSet={(data) => handleAddSet(exercise.id, data)}
                      onExerciseComplete={() => handleExerciseComplete(exercise.id, exercise.name, exercise.prime_muscle)}
                    />
                  </motion.div>
                </FadeIn>
              );
            })}
          </div>

          <FeedbackDialog
            open={feedbackDialog.open}
            onOpenChange={(open) => setFeedbackDialog(prev => ({ ...prev, open }))}
            exerciseName={feedbackDialog.exerciseName}
            muscleName={feedbackDialog.muscleName}
            onSubmit={handleFeedbackSubmit}
          />
        </div>
      </PageTransition>
    </AppLayout>
  );
}
