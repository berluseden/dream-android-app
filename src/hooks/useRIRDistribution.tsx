import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface RIRDistribution {
  rir: number;
  count: number;
  percentage: number;
}

export function useRIRDistribution(userId: string, weeks: number = 4) {
  return useQuery({
    queryKey: ['rir-distribution', userId, weeks],
    queryFn: async () => {
      if (!userId) return [];
      
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (weeks * 7));
      
      // Get workouts in date range
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('user_id', '==', userId),
        where('completed_at', '>=', startDate),
        where('completed_at', '<=', today),
        where('status', '==', 'completed')
      );
      
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workoutIds = workoutsSnapshot.docs.map(doc => doc.id);
      
      if (workoutIds.length === 0) return [];
      
      // Count RIR values
      const rirCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
      let totalSets = 0;
      
      for (const workoutId of workoutIds) {
        const setsQuery = query(
          collection(db, 'sets'),
          where('workout_id', '==', workoutId),
          where('set_type', '==', 'working') // Only working sets
        );
        
        const setsSnapshot = await getDocs(setsQuery);
        
        setsSnapshot.docs.forEach(setDoc => {
          const rir = setDoc.data().rir_actual;
          if (rir !== undefined && rir >= 0 && rir <= 4) {
            rirCounts[rir]++;
            totalSets++;
          }
        });
      }
      
      // Convert to distribution with percentages
      const distribution: RIRDistribution[] = Object.entries(rirCounts).map(([rir, count]) => ({
        rir: parseInt(rir),
        count,
        percentage: totalSets > 0 ? Math.round((count / totalSets) * 100) : 0,
      }));
      
      return distribution;
    },
    enabled: !!userId,
  });
}
