import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, setDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { calculateRecoveryScore, RecoveryInputs, RecoveryScore } from '@/lib/recovery';
import { subDays, startOfDay } from 'date-fns';

export interface RecoveryEntry {
  id: string;
  user_id: string;
  date: Date;
  sleep_hours: number;
  hrv: number;
  resting_hr: number;
  soreness: number;
  notes?: string;
  created_at: Date;
}

/**
 * Hook to get recovery score for a user
 * Calculates based on last 7 days of data
 */
export function useRecoveryScore(userId?: string, days: number = 7) {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;

  return useQuery<RecoveryScore | null>({
    queryKey: ['recovery-score', targetUserId, days],
    queryFn: async () => {
      if (!targetUserId) return null;

      const startDate = startOfDay(subDays(new Date(), days));

      // Get recovery entries
      const entriesQuery = query(
        collection(db, 'recovery_entries'),
        where('user_id', '==', targetUserId),
        where('date', '>=', startDate),
        orderBy('date', 'desc')
      );

      const entriesSnapshot = await getDocs(entriesQuery);
      const entries = entriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        created_at: doc.data().created_at?.toDate(),
      })) as RecoveryEntry[];

      if (entries.length === 0) {
        return null; // No data yet
      }

      // Calculate averages
      const avgSleep = entries.reduce((sum, e) => sum + e.sleep_hours, 0) / entries.length;
      const avgHRV = entries.reduce((sum, e) => sum + e.hrv, 0) / entries.length;
      const avgRestingHR = entries.reduce((sum, e) => sum + e.resting_hr, 0) / entries.length;
      const avgSoreness = entries.reduce((sum, e) => sum + e.soreness, 0) / entries.length;

      // Get adherence from workouts
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('user_id', '==', targetUserId),
        where('planned_date', '>=', startDate)
      );

      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts = workoutsSnapshot.docs.map(doc => doc.data());
      const total = workouts.length;
      const completed = workouts.filter(w => w.status === 'completed').length;
      const adherence = total > 0 ? (completed / total) * 100 : 100;

      const inputs: RecoveryInputs = {
        sleepHours: avgSleep,
        avgHRV: avgHRV,
        restingHR: avgRestingHR,
        avgSoreness: avgSoreness,
        adherence: adherence,
      };

      return calculateRecoveryScore(inputs);
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get recovery entries history
 */
export function useRecoveryEntries(userId?: string, days: number = 30) {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;

  return useQuery<RecoveryEntry[]>({
    queryKey: ['recovery-entries', targetUserId, days],
    queryFn: async () => {
      if (!targetUserId) return [];

      const startDate = startOfDay(subDays(new Date(), days));

      const q = query(
        collection(db, 'recovery_entries'),
        where('user_id', '==', targetUserId),
        where('date', '>=', startDate),
        orderBy('date', 'desc'),
        limit(days)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        created_at: doc.data().created_at?.toDate(),
      })) as RecoveryEntry[];
    },
    enabled: !!targetUserId,
  });
}

/**
 * Hook to log daily recovery data
 */
export function useLogRecovery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<RecoveryEntry, 'id' | 'user_id' | 'created_at'>) => {
      if (!user?.uid) throw new Error('User not authenticated');

      const today = startOfDay(new Date());
      const entryId = `${user.uid}_${today.toISOString().split('T')[0]}`;

      const entryRef = doc(db, 'recovery_entries', entryId);
      await setDoc(entryRef, {
        user_id: user.uid,
        date: today,
        sleep_hours: data.sleep_hours,
        hrv: data.hrv,
        resting_hr: data.resting_hr,
        soreness: data.soreness,
        notes: data.notes || '',
        created_at: new Date(),
      });

      return { id: entryId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recovery-score'] });
      queryClient.invalidateQueries({ queryKey: ['recovery-entries'] });
    },
  });
}

/**
 * Hook to get today's recovery entry (if exists)
 */
export function useTodayRecovery() {
  const { user } = useAuth();

  return useQuery<RecoveryEntry | null>({
    queryKey: ['today-recovery', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;

      const today = startOfDay(new Date());
      const entryId = `${user.uid}_${today.toISOString().split('T')[0]}`;

      const entryRef = doc(db, 'recovery_entries', entryId);
      const entryDoc = await getDocs(query(collection(db, 'recovery_entries'), where('__name__', '==', entryId)));

      if (entryDoc.empty) return null;

      const data = entryDoc.docs[0].data();
      return {
        id: entryDoc.docs[0].id,
        ...data,
        date: data.date?.toDate(),
        created_at: data.created_at?.toDate(),
      } as RecoveryEntry;
    },
    enabled: !!user?.uid,
  });
}
