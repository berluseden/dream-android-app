import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useExercises } from '@/hooks/useExercises';
import { findSimilarExercises, Exercise } from '@/lib/exerciseMatching';
import { detectPlateau, SetHistory } from '@/lib/algorithms';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to detect if exercise has plateaued
 * Returns plateau status and recommended substitutes
 */
export function usePlateauDetection(exerciseId: string, threshold: number = 3) {
  const { user } = useAuth();
  const { data: allExercises } = useExercises();

  return useQuery<{
    isPlateaued: boolean;
    sessionsWithoutImprovement: number;
    suggestedSubstitutes: Exercise[];
  }>({
    queryKey: ['plateau-detection', exerciseId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !allExercises) return {
        isPlateaued: false,
        sessionsWithoutImprovement: 0,
        suggestedSubstitutes: [],
      };

      // Get last 10 sets for this exercise
      const setsQuery = query(
        collection(db, 'sets'),
        where('exercise_id', '==', exerciseId),
        where('set_type', '==', 'working')
      );

      const snapshot = await getDocs(setsQuery);
      const sets = snapshot.docs.map(doc => doc.data());

      // Convert to SetHistory format
      const history: SetHistory[] = sets.map((set: any) => ({
        load: set.load,
        completed_reps: set.completed_reps,
        rir_actual: set.rir_actual,
        rpe: set.rpe,
        perceived_pump: set.perceived_pump,
        perceived_soreness: set.perceived_soreness,
        created_at: set.created_at?.toDate() || new Date(),
      }));

      const plateauResult = detectPlateau(history, threshold);

      // If plateaued, suggest alternatives
      let suggestedSubstitutes: Exercise[] = [];
      if (plateauResult.isPlateaued) {
        const targetExercise = allExercises.find((ex: any) => ex.id === exerciseId);
        if (targetExercise) {
          const userEquipment = ['barbell', 'dumbbells', 'machine', 'bodyweight', 'cables'];
          suggestedSubstitutes = findSimilarExercises(targetExercise, userEquipment, allExercises);
        }
      }

      return {
        isPlateaued: plateauResult.isPlateaued,
        sessionsWithoutImprovement: plateauResult.sessionsWithoutImprovement,
        suggestedSubstitutes,
      };
    },
    enabled: !!exerciseId && !!user?.uid && !!allExercises,
  });
}

export function useSuggestedSubstitutions(exerciseId: string) {
  const { data: allExercises } = useExercises();
  const { user } = useAuth();

  return useQuery<Exercise[]>({
    queryKey: ['suggestedSubstitutions', exerciseId],
    queryFn: async () => {
      if (!allExercises || !user) return [];
      
      const targetExercise = allExercises.find((ex: any) => ex.id === exerciseId);
      if (!targetExercise) return [];
      
      // Get user equipment preferences (default to all common equipment)
      const userEquipment = ['barbell', 'dumbbells', 'machine', 'bodyweight', 'cables'];
      
      return findSimilarExercises(targetExercise, userEquipment, allExercises);
    },
    enabled: !!exerciseId && !!allExercises && !!user,
  });
}

export function useSubstituteExercise() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      workout_id: string;
      original_exercise_id: string;
      new_exercise_id: string;
      reason: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('No user');

      // Save substitution record
      await addDoc(collection(db, 'exercise_substitutions'), {
        user_id: user.uid,
        workout_id: data.workout_id,
        original_exercise_id: data.original_exercise_id,
        new_exercise_id: data.new_exercise_id,
        reason: data.reason,
        notes: data.notes || '',
        substituted_at: Timestamp.now(),
      });

      // Update ALL future pending sets for this workout+exercise to use new exercise
      const setsQuery = query(
        collection(db, 'sets'),
        where('workout_id', '==', data.workout_id),
        where('exercise_id', '==', data.original_exercise_id)
      );
      
      const snapshot = await getDocs(setsQuery);
      
      // Batch update sets (update pending sets only)
      const updatePromises = snapshot.docs
        .filter(doc => doc.data().completed_reps === 0 || !doc.data().completed_reps)
        .map(doc => updateDoc(doc.ref, {
          exercise_id: data.new_exercise_id,
          notes: `Sustituido de ejercicio original. Razón: ${data.reason}`,
        }));

      await Promise.all(updatePromises);

      return { updatedCount: updatePromises.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['workout-sets'] });
      queryClient.invalidateQueries({ queryKey: ['today-workout'] });
      toast({
        title: 'Ejercicio sustituido',
        description: `${result.updatedCount} series actualizadas correctamente`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo sustituir el ejercicio',
        variant: 'destructive',
      });
      console.error('Error substituting exercise:', error);
    },
  });
}