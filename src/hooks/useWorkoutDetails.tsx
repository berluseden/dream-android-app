import { useQuery } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { startOfDay, endOfDay } from 'date-fns';
import type { TodayWorkoutDetails, WorkoutExercise } from '@/types/workout-exercise.types';

/**
 * Hook para obtener los detalles completos del workout de hoy
 * Incluye información del workout, ejercicios y datos del mesociclo
 */
export function useTodayWorkoutDetails(userId: string) {
  return useQuery<TodayWorkoutDetails | null>({
    queryKey: ['today-workout-details', userId],
    queryFn: async () => {
      const today = new Date();
      const dayStart = startOfDay(today);
      const dayEnd = endOfDay(today);

      // 1. Buscar workout de hoy
      const workoutsRef = collection(db, 'workouts');
      const workoutsQuery = query(
        workoutsRef,
        where('user_id', '==', userId),
        where('scheduled_date', '>=', Timestamp.fromDate(dayStart)),
        where('scheduled_date', '<=', Timestamp.fromDate(dayEnd)),
        where('status', '==', 'scheduled')
      );

      const workoutSnapshot = await getDocs(workoutsQuery);

      if (workoutSnapshot.empty) {
        return null; // No hay workout hoy
      }

      const workoutDoc = workoutSnapshot.docs[0];
      const workoutData = workoutDoc.data();

      // 2. Obtener ejercicios del workout
      const exercisesRef = collection(db, 'workout_exercises');
      const exercisesQuery = query(
        exercisesRef,
        where('workout_id', '==', workoutDoc.id)
      );

      const exercisesSnapshot = await getDocs(exercisesQuery);
      const workoutExercises: WorkoutExercise[] = [];

      // 3. Para cada workout_exercise, obtener detalles del ejercicio
      for (const exDoc of exercisesSnapshot.docs) {
        const exData = exDoc.data();

        // Obtener detalles completos del ejercicio desde la colección exercises
        const exerciseRef = doc(db, 'exercises', exData.exercise_id);
        const exerciseSnap = await getDoc(exerciseRef);

        if (exerciseSnap.exists()) {
          const exerciseDetails = exerciseSnap.data();

          workoutExercises.push({
            id: exDoc.id,
            workout_id: exData.workout_id,
            exercise_id: exData.exercise_id,
            exercise_name: exerciseDetails.name,
            order: exData.order_index || 0,
            sets_target: exData.target_sets || 0,
            rep_range_min: typeof exData.target_reps === 'string' ? parseInt(exData.target_reps.split('-')[0]) : exData.target_reps,
            rep_range_max: typeof exData.target_reps === 'string' ? parseInt(exData.target_reps.split('-')[1]) : exData.target_reps,
            rir_target: exData.target_rir || 2,
            rest_seconds: 120, // Default, puede venir del template
            notes: exData.notes || '',
            created_at: exData.created_at?.toDate() || new Date(),
          });
        }
      }

      // 4. Obtener información del mesociclo
      const mesocycleRef = doc(db, 'mesocycles', workoutData.mesocycle_id);
      const mesocycleSnap = await getDoc(mesocycleRef);

      if (!mesocycleSnap.exists()) {
        return null;
      }

      const mesocycleData = mesocycleSnap.data();

      // 5. Construir objeto completo
      const todayWorkout: TodayWorkoutDetails = {
        workout: {
          id: workoutDoc.id,
          mesocycle_id: workoutData.mesocycle_id,
          user_id: workoutData.user_id,
          day_index: workoutData.day_number || 1,
          session_name: workoutData.name,
          planned_date: workoutData.scheduled_date.toDate(),
          status: workoutData.status === 'completed' ? 'completed' : 'pending',
          completed_at: null,
          duration_minutes: null,
          notes: workoutData.description || '',
        },
        mesocycle: {
          id: mesocycleSnap.id,
          user_id: mesocycleData.user_id,
          template_id: mesocycleData.template_id || '',
          name: mesocycleData.name,
          start_date: mesocycleData.start_date.toDate(),
          length_weeks: mesocycleData.length_weeks,
          status: mesocycleData.status,
        },
        exercises: workoutExercises.sort((a, b) => a.order - b.order),
        weekNumber: workoutData.week_number || 1,
        totalWeeks: mesocycleData.length_weeks,
        dayNumber: workoutData.day_number || 1,
        totalDays: mesocycleData.length_weeks * 7,
      };

      return todayWorkout;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!userId,
  });
}

/**
 * Hook para verificar si el usuario tiene un workout programado hoy
 */
export function useHasTodayWorkout(userId: string) {
  const { data: todayWorkout, isLoading } = useTodayWorkoutDetails(userId);

  return {
    hasWorkout: !!todayWorkout,
    isLoading,
    workout: todayWorkout,
  };
}

/**
 * Hook para obtener estadísticas rápidas del workout de hoy
 */
export function useTodayWorkoutStats(userId: string) {
  const { data: todayWorkout } = useTodayWorkoutDetails(userId);

  if (!todayWorkout) {
    return {
      totalExercises: 0,
      totalSets: 0,
      estimatedDuration: 0,
    };
  }

  const totalExercises = todayWorkout.exercises.length;
  const totalSets = todayWorkout.exercises.reduce(
    (sum, ex) => sum + ex.sets_target,
    0
  );

  // Estimación: 3 min por serie + 2 min por ejercicio (calentamiento/setup)
  const estimatedDuration = totalSets * 3 + totalExercises * 2;

  return {
    totalExercises,
    totalSets,
    estimatedDuration, // en minutos
  };
}
