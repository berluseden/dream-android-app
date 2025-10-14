import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  orderBy,
  serverTimestamp,
  increment,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Workout {
  id: string;
  mesocycle_id: string;
  user_id: string;
  day_index: number;
  planned_date: Date;
  completed_at: Date | null;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  duration_minutes: number | null;
  notes: string;
  coach_notes: string | null;
}

export interface Set {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  target_reps: number;
  rir_target: number;
  load: number;
  completed_reps: number;
  rir_actual: number;
  rpe: number;
  perceived_pump: number;
  perceived_soreness: number;
  notes: string;
  created_at: Date;
  modified_by: string;
}

export function useWorkouts(mesocycleId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['workouts', mesocycleId, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      let q = query(
        collection(db, 'workouts'),
        where('user_id', '==', user.uid),
        orderBy('planned_date', 'desc')
      );
      
      if (mesocycleId) {
        q = query(q, where('mesocycle_id', '==', mesocycleId));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        planned_date: doc.data().planned_date?.toDate(),
        completed_at: doc.data().completed_at?.toDate(),
      })) as Workout[];
    },
    enabled: !!user?.uid,
  });
}

export function useTodayWorkout() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['today-workout', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const q = query(
        collection(db, 'workouts'),
        where('user_id', '==', user.uid),
        where('planned_date', '>=', today),
        where('planned_date', '<', tomorrow)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        planned_date: doc.data().planned_date?.toDate(),
        completed_at: doc.data().completed_at?.toDate(),
      } as Workout;
    },
    enabled: !!user?.uid,
  });
}

export function useWorkoutSets(workoutId: string) {
  return useQuery({
    queryKey: ['workout-sets', workoutId],
    queryFn: async () => {
      const q = query(
        collection(db, 'sets'),
        where('workout_id', '==', workoutId),
        orderBy('created_at', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
      })) as Set[];
    },
    enabled: !!workoutId,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: Omit<Workout, 'id' | 'completed_at' | 'duration_minutes' | 'coach_notes'>) => {
      const workoutRef = doc(collection(db, 'workouts'));
      await setDoc(workoutRef, {
        ...data,
        completed_at: null,
        duration_minutes: null,
        coach_notes: null,
      });
      
      return { id: workoutRef.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast({
        title: "Entrenamiento creado",
      });
    },
  });
}

export function useAddSet() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (setData: Omit<Set, 'id' | 'created_at' | 'modified_by'>) => {
      // Create set
      const setRef = doc(collection(db, 'sets'));
      await setDoc(setRef, {
        ...setData,
        created_at: serverTimestamp(),
        modified_by: user?.uid || '',
      });
      
      // Update weekly_targets.actual_sets
      const exerciseDoc = await getDoc(doc(db, 'exercises', setData.exercise_id));
      if (exerciseDoc.exists()) {
        const muscleId = exerciseDoc.data().prime_muscle;
        
        const workoutDoc = await getDoc(doc(db, 'workouts', setData.workout_id));
        if (workoutDoc.exists()) {
          const mesocycleId = workoutDoc.data().mesocycle_id;
          
          // Calculate current week
          const mesoDoc = await getDoc(doc(db, 'mesocycles', mesocycleId));
          if (mesoDoc.exists()) {
            const startDate = mesoDoc.data().start_date.toDate();
            const currentWeek = Math.ceil((Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
            
            // Find and increment weekly target
            const targetQuery = query(
              collection(db, 'weekly_targets'),
              where('mesocycle_id', '==', mesocycleId),
              where('muscle_id', '==', muscleId),
              where('week_number', '==', currentWeek)
            );
            
            const targetSnapshot = await getDocs(targetQuery);
            if (!targetSnapshot.empty) {
              await updateDoc(targetSnapshot.docs[0].ref, {
                actual_sets: increment(1),
              });
            }
          }
        }
      }
      
      return { id: setRef.id, ...setData };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workout-sets', variables.workout_id] });
      queryClient.invalidateQueries({ queryKey: ['weekly-targets'] });
      toast({
        title: "Serie registrada",
      });
    },
  });
}

export function useCompleteWorkout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ workoutId, duration }: { workoutId: string; duration: number }) => {
      await updateDoc(doc(db, 'workouts', workoutId), {
        status: 'completed',
        completed_at: serverTimestamp(),
        duration_minutes: duration,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['today-workout'] });
      toast({
        title: "¡Entrenamiento completado!",
        description: "Buen trabajo 💪",
      });
    },
  });
}
