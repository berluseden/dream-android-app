import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { calculateE1RMWithRIR } from '@/lib/algorithms';

export function useWeeklyVolume(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;
  
  return useQuery({
    queryKey: ['weekly-volume', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return 0;
      
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('user_id', '==', targetUserId),
        where('completed_at', '>=', weekAgo),
        where('completed_at', '<=', today)
      );
      
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workoutIds = workoutsSnapshot.docs.map(doc => doc.id);
      
      if (workoutIds.length === 0) return 0;
      
      let totalSets = 0;
      for (const workoutId of workoutIds) {
        const setsQuery = query(
          collection(db, 'sets'),
          where('workout_id', '==', workoutId)
        );
        const setsSnapshot = await getDocs(setsQuery);
        totalSets += setsSnapshot.size;
      }
      
      return totalSets;
    },
    enabled: !!targetUserId,
  });
}

export function useAdherence(userId?: string, weeks: number = 4) {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;
  
  return useQuery({
    queryKey: ['adherence', targetUserId, weeks],
    queryFn: async () => {
      if (!targetUserId) return 0;
      
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (weeks * 7));
      
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('user_id', '==', targetUserId),
        where('planned_date', '>=', startDate),
        where('planned_date', '<=', today)
      );
      
      const snapshot = await getDocs(workoutsQuery);
      const workouts = snapshot.docs.map(doc => doc.data());
      
      const total = workouts.length;
      const completed = workouts.filter(w => w.status === 'completed').length;
      
      return total > 0 ? Math.round((completed / total) * 100) : 0;
    },
    enabled: !!targetUserId,
  });
}

export function useStrengthProgression(userId?: string, exerciseId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;
  
  return useQuery({
    queryKey: ['strength-progression', targetUserId, exerciseId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      let setsQuery = query(
        collection(db, 'sets'),
        orderBy('created_at', 'desc'),
        limit(50)
      );
      
      if (exerciseId) {
        setsQuery = query(setsQuery, where('exercise_id', '==', exerciseId));
      }
      
      const snapshot = await getDocs(setsQuery);
      const sets = snapshot.docs.map(doc => doc.data());
      
      return sets.map(set => ({
        date: set.created_at?.toDate() || new Date(),
        e1rm: calculateE1RMWithRIR(
          set.load,
          set.completed_reps,
          set.rir_actual
        ),
        exercise_id: set.exercise_id,
      }));
    },
    enabled: !!targetUserId,
  });
}

export function useVolumeByMuscle(userId?: string, weeks: number = 4) {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;
  
  return useQuery({
    queryKey: ['volume-by-muscle', targetUserId, weeks],
    queryFn: async () => {
      if (!targetUserId) return {};
      
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (weeks * 7));
      
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('user_id', '==', targetUserId),
        where('completed_at', '>=', startDate),
        where('completed_at', '<=', today),
        where('status', '==', 'completed')
      );
      
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workoutIds = workoutsSnapshot.docs.map(doc => doc.id);
      
      if (workoutIds.length === 0) return {};
      
      const muscleVolume: Record<string, number> = {};
      
      for (const workoutId of workoutIds) {
        const setsQuery = query(
          collection(db, 'sets'),
          where('workout_id', '==', workoutId)
        );
        
        const setsSnapshot = await getDocs(setsQuery);
        
        for (const setDoc of setsSnapshot.docs) {
          const set = setDoc.data();
          const exerciseDoc = await getDocs(
            query(collection(db, 'exercises'), where('__name__', '==', set.exercise_id))
          );
          
          if (!exerciseDoc.empty) {
            const exercise = exerciseDoc.docs[0].data();
            const muscleId = exercise.prime_muscle;
            
            muscleVolume[muscleId] = (muscleVolume[muscleId] || 0) + 1;
          }
        }
      }
      
      return muscleVolume;
    },
    enabled: !!targetUserId,
  });
}
