import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateE1RMWithRIR } from '@/lib/algorithms';

export interface ClientKPIs {
  adherence: number;
  weeklyVolume: number;
  fatigueAlerts: number;
  recentPRs: number;
}

export function useClientKPIs(clientId: string, weeks: number = 4) {
  return useQuery({
    queryKey: ['client-kpis', clientId, weeks],
    queryFn: async () => {
      if (!clientId) return {
        adherence: 0,
        weeklyVolume: 0,
        fatigueAlerts: 0,
        recentPRs: 0,
      };
      
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (weeks * 7));
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      
      // ADHERENCE (last N weeks)
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('user_id', '==', clientId),
        where('planned_date', '>=', startDate),
        where('planned_date', '<=', today)
      );
      
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts = workoutsSnapshot.docs.map(doc => doc.data());
      
      const totalWorkouts = workouts.length;
      const completedWorkouts = workouts.filter(w => w.status === 'completed').length;
      const adherence = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
      
      // WEEKLY VOLUME (last 7 days)
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentWorkoutsQuery = query(
        collection(db, 'workouts'),
        where('user_id', '==', clientId),
        where('completed_at', '>=', weekAgo),
        where('completed_at', '<=', today),
        where('status', '==', 'completed')
      );
      
      const recentWorkoutsSnapshot = await getDocs(recentWorkoutsQuery);
      const recentWorkoutIds = recentWorkoutsSnapshot.docs.map(doc => doc.id);
      
      let weeklyVolume = 0;
      let fatigueAlerts = 0;
      
      for (const workoutId of recentWorkoutIds) {
        const setsQuery = query(
          collection(db, 'sets'),
          where('workout_id', '==', workoutId)
        );
        
        const setsSnapshot = await getDocs(setsQuery);
        weeklyVolume += setsSnapshot.size;
        
        // Count fatigue alerts (RIR < 1 or soreness > 7)
        setsSnapshot.docs.forEach(setDoc => {
          const data = setDoc.data();
          if (data.rir_actual < 1 || data.perceived_soreness > 7) {
            fatigueAlerts++;
          }
        });
      }
      
      // RECENT PRs (last 30 days)
      // A PR is when e1RM exceeds previous max for that exercise
      const prSetsQuery = query(
        collection(db, 'sets'),
        where('modified_by', '==', clientId),
        where('created_at', '>=', monthAgo),
        orderBy('created_at', 'desc'),
        limit(100)
      );
      
      const prSetsSnapshot = await getDocs(prSetsQuery);
      
      // Group by exercise and find PRs
      const exerciseMaxE1RM: Record<string, number> = {};
      let recentPRs = 0;
      
      prSetsSnapshot.docs.forEach(setDoc => {
        const data = setDoc.data();
        const exerciseId = data.exercise_id;
        const e1rm = calculateE1RMWithRIR(data.load || 0, data.completed_reps || 0, data.rir_actual || 2);
        
        if (!exerciseMaxE1RM[exerciseId] || e1rm > exerciseMaxE1RM[exerciseId]) {
          if (exerciseMaxE1RM[exerciseId]) {
            recentPRs++; // This is a new PR
          }
          exerciseMaxE1RM[exerciseId] = e1rm;
        }
      });
      
      return {
        adherence,
        weeklyVolume,
        fatigueAlerts,
        recentPRs,
      };
    },
    enabled: !!clientId,
  });
}
