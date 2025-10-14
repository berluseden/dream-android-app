import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateE1RMWithRIR } from '@/lib/algorithms';

export interface WeeklySummary {
  adherence: number;
  totalVolume: number;
  avgFatigue: number; // Promedio de RIR (0-4)
  e1rmChange: number; // Porcentaje de cambio
}

export function useWeeklySummary(userId: string) {
  return useQuery({
    queryKey: ['weekly-summary', userId],
    queryFn: async () => {
      if (!userId) return {
        adherence: 0,
        totalVolume: 0,
        avgFatigue: 0,
        e1rmChange: 0,
      };
      
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      // ADHERENCE
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('user_id', '==', userId),
        where('planned_date', '>=', weekAgo),
        where('planned_date', '<=', today)
      );
      
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts = workoutsSnapshot.docs.map(doc => doc.data());
      
      const totalWorkouts = workouts.length;
      const completedWorkouts = workouts.filter(w => w.status === 'completed').length;
      const adherence = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
      
      // TOTAL VOLUME (sets this week)
      const completedWorkoutIds = workoutsSnapshot.docs
        .filter(doc => doc.data().status === 'completed')
        .map(doc => doc.id);
      
      let totalVolume = 0;
      let totalRIR = 0;
      let rirCount = 0;
      
      for (const workoutId of completedWorkoutIds) {
        const setsQuery = query(
          collection(db, 'sets'),
          where('workout_id', '==', workoutId)
        );
        
        const setsSnapshot = await getDocs(setsQuery);
        totalVolume += setsSnapshot.size;
        
        setsSnapshot.docs.forEach(setDoc => {
          const rir = setDoc.data().rir_actual;
          if (rir !== undefined) {
            totalRIR += rir;
            rirCount++;
          }
        });
      }
      
      // AVG FATIGUE (lower RIR = higher fatigue)
      const avgFatigue = rirCount > 0 ? parseFloat((totalRIR / rirCount).toFixed(1)) : 2;
      
      // E1RM CHANGE (this week vs last week)
      const thisWeekSetsQuery = query(
        collection(db, 'sets'),
        where('modified_by', '==', userId),
        where('created_at', '>=', weekAgo),
        orderBy('created_at', 'desc'),
        limit(20)
      );
      
      const lastWeekSetsQuery = query(
        collection(db, 'sets'),
        where('modified_by', '==', userId),
        where('created_at', '>=', twoWeeksAgo),
        where('created_at', '<', weekAgo),
        orderBy('created_at', 'desc'),
        limit(20)
      );
      
      const thisWeekSnapshot = await getDocs(thisWeekSetsQuery);
      const lastWeekSnapshot = await getDocs(lastWeekSetsQuery);
      
      const calcAvgE1RM = (snapshot: any) => {
        const e1rms = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          return calculateE1RMWithRIR(data.load || 0, data.completed_reps || 0, data.rir_actual || 2);
        });
        return e1rms.length > 0 ? e1rms.reduce((sum: number, val: number) => sum + val, 0) / e1rms.length : 0;
      };
      
      const thisWeekE1RM = calcAvgE1RM(thisWeekSnapshot);
      const lastWeekE1RM = calcAvgE1RM(lastWeekSnapshot);
      
      const e1rmChange = lastWeekE1RM > 0
        ? parseFloat((((thisWeekE1RM - lastWeekE1RM) / lastWeekE1RM) * 100).toFixed(1))
        : 0;
      
      return {
        adherence,
        totalVolume,
        avgFatigue,
        e1rmChange,
      };
    },
    enabled: !!userId,
  });
}
