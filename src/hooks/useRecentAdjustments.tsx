import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface RecentAdjustment {
  id: string;
  exercise_name: string;
  load: number;
  reps: number;
  adjustment_reason: string;
  created_at: Date;
}

export function useRecentAdjustments(userId: string, limitCount: number = 5) {
  return useQuery({
    queryKey: ['recent-adjustments', userId, limitCount],
    queryFn: async () => {
      if (!userId) return [];
      
      const setsQuery = query(
        collection(db, 'sets'),
        where('modified_by', '==', userId),
        orderBy('created_at', 'desc'),
        limit(limitCount * 3) // Get more to filter out those without adjustment_reason
      );
      
      const snapshot = await getDocs(setsQuery);
      const adjustments: RecentAdjustment[] = [];
      
      for (const setDoc of snapshot.docs) {
        const setData = setDoc.data();
        
        // Only include sets with adjustment reasons
        if (!setData.adjustment_reason) continue;
        
        // Get exercise name
        const exerciseDoc = await getDoc(doc(db, 'exercises', setData.exercise_id));
        const exerciseName = exerciseDoc.exists() ? exerciseDoc.data().name : 'Ejercicio desconocido';
        
        adjustments.push({
          id: setDoc.id,
          exercise_name: exerciseName,
          load: setData.load || 0,
          reps: setData.completed_reps || 0,
          adjustment_reason: setData.adjustment_reason,
          created_at: setData.created_at?.toDate() || new Date(),
        });
        
        if (adjustments.length >= limitCount) break;
      }
      
      return adjustments;
    },
    enabled: !!userId,
  });
}
