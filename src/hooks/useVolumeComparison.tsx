import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { subWeeks } from 'date-fns';

export interface VolumeComparisonData {
  muscle: string;
  target: number;
  actual: number;
  status: 'optimal' | 'attention' | 'problem';
}

export function useVolumeComparison(userId: string, weeks: number = 4) {
  const { user } = useAuth();

  return useQuery<VolumeComparisonData[]>({
    queryKey: ['volumeComparison', userId || user?.uid, weeks],
    queryFn: async () => {
      const uid = userId || user?.uid;
      if (!uid) return [];

      const startDate = subWeeks(new Date(), weeks);
      
      const setsQuery = query(
        collection(db, 'sets'),
        where('user_id', '==', uid),
        where('created_at', '>=', Timestamp.fromDate(startDate)),
        where('set_type', '==', 'working')
      );
      
      const snapshot = await getDocs(setsQuery);
      const sets = snapshot.docs.map(doc => doc.data());

      // Get exercises
      const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
      const exercisesMap = new Map(
        exercisesSnapshot.docs.map(doc => [doc.id, doc.data()])
      );

      // Count sets per muscle
      const muscleSets: Record<string, number> = {};
      sets.forEach((set: any) => {
        const exercise = exercisesMap.get(set.exercise_id);
        if (exercise) {
          const muscle = exercise.prime_muscle;
          muscleSets[muscle] = (muscleSets[muscle] || 0) + 1;
        }
      });

      // Calculate status
      const target = 12 * weeks; // 12 sets per week per muscle
      
      return Object.entries(muscleSets).map(([muscle, actual]) => {
        const ratio = actual / target;
        let status: 'optimal' | 'attention' | 'problem' = 'optimal';
        
        if (ratio < 0.8 || ratio > 1.2) status = 'problem';
        else if (ratio < 0.9 || ratio > 1.1) status = 'attention';
        
        return { muscle, target, actual, status };
      });
    },
    enabled: !!(userId || user?.uid),
  });
}