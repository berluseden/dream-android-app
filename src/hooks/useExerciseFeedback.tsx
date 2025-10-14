import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { ExerciseFeedback } from '@/types/user.types';

export function useExerciseFeedback(workoutId?: string) {
  return useQuery({
    queryKey: ['exercise-feedback', workoutId],
    queryFn: async () => {
      if (!workoutId) return [];
      
      const q = query(
        collection(db, 'exercise_feedback'),
        where('workout_id', '==', workoutId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
      })) as ExerciseFeedback[];
    },
    enabled: !!workoutId,
  });
}

export function useAddExerciseFeedback() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: Omit<ExerciseFeedback, 'id' | 'created_at'>) => {
      const feedbackRef = doc(collection(db, 'exercise_feedback'));
      await setDoc(feedbackRef, {
        ...data,
        created_at: serverTimestamp(),
      });
      
      return { id: feedbackRef.id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exercise-feedback', variables.workout_id] });
      toast({
        title: "Feedback guardado",
        description: "Gracias por tu retroalimentación",
      });
    },
  });
}
