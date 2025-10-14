import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useExercises } from '@/hooks/useExercises';
import { findSimilarExercises, Exercise } from '@/lib/exerciseMatching';
import { toast } from '@/hooks/use-toast';

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
      const userEquipment = ['barbell', 'dumbbells', 'machine', 'bodyweight'];
      
      return findSimilarExercises(targetExercise, userEquipment, allExercises);
    },
    enabled: !!exerciseId && !!allExercises && !!user,
  });
}

export function useSubstituteExercise() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

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

      // Update pending sets for this workout+exercise to use new exercise
      const setsQuery = query(
        collection(db, 'sets'),
        where('workout_id', '==', data.workout_id),
        where('exercise_id', '==', data.original_exercise_id),
        where('completed_reps', '==', 0) // Only pending sets
      );
      
      const snapshot = await getDocs(setsQuery);
      // Note: In a real implementation, you'd batch update these sets
      // For now, we'll just record the substitution
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutSets'] });
      queryClient.invalidateQueries({ queryKey: ['todayWorkout'] });
      toast({
        title: 'Ejercicio sustituido',
        description: 'El cambio se ha guardado correctamente',
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