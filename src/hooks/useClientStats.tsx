import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { calculateE1RMWithRIR } from '@/lib/algorithms';
import { subDays, startOfWeek, endOfWeek, differenceInWeeks } from 'date-fns';

interface AdherenceData {
  week: string;
  adherence: number;
  completed: number;
  planned: number;
}

interface VolumeHeatmapData {
  muscle: string;
  week: number;
  sets: number;
  target: number;
  status: 'optimal' | 'attention' | 'problem';
}

interface FatigueAlert {
  exerciseId: string;
  exerciseName: string;
  avgSoreness: number;
  lastWorkout: Date;
}

interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  e1rm: number;
  previousE1rm: number;
  improvement: number;
  date: Date;
}

export function useClientAdherence(clientId: string, weeks: number = 8) {
  return useQuery<AdherenceData[]>({
    queryKey: ['clientAdherence', clientId, weeks],
    queryFn: async () => {
      const startDate = subDays(new Date(), weeks * 7);
      
      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('user_id', '==', clientId),
        where('planned_date', '>=', Timestamp.fromDate(startDate)),
        orderBy('planned_date', 'asc')
      );
      
      const snapshot = await getDocs(workoutsQuery);
      const workouts = snapshot.docs.map(doc => ({
        ...doc.data(),
        planned_date: doc.data().planned_date?.toDate(),
      }));

      // Group by week
      const weeklyData: Record<string, { planned: number; completed: number }> = {};
      
      workouts.forEach((workout: any) => {
        const weekStart = startOfWeek(workout.planned_date);
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { planned: 0, completed: 0 };
        }
        
        weeklyData[weekKey].planned++;
        if (workout.status === 'completed') {
          weeklyData[weekKey].completed++;
        }
      });

      return Object.entries(weeklyData).map(([week, data]) => ({
        week: `S${differenceInWeeks(new Date(week), startDate) + 1}`,
        adherence: data.planned > 0 ? Math.round((data.completed / data.planned) * 100) : 0,
        completed: data.completed,
        planned: data.planned,
      }));
    },
    enabled: !!clientId,
  });
}

export function useClientVolumeHeatmap(clientId: string, mesocycleId: string) {
  return useQuery<VolumeHeatmapData[]>({
    queryKey: ['clientVolumeHeatmap', clientId, mesocycleId],
    queryFn: async () => {
      // Get mesocycle start date
      const mesoDoc = await getDocs(query(collection(db, 'mesocycles'), where('__name__', '==', mesocycleId), limit(1)));
      if (mesoDoc.empty) return [];
      
      const mesoStart = mesoDoc.docs[0].data().start_date?.toDate();
      
      // Get all sets
      const setsQuery = query(
        collection(db, 'sets'),
        where('user_id', '==', clientId),
        where('created_at', '>=', Timestamp.fromDate(mesoStart))
      );
      
      const snapshot = await getDocs(setsQuery);
      const sets = snapshot.docs.map(doc => ({
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
      }));

      // Get exercises to map to muscles
      const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
      const exercisesMap = new Map(
        exercisesSnapshot.docs.map(doc => [doc.id, doc.data()])
      );

      // Group by muscle and week
      const heatmapData: Record<string, Record<number, number>> = {};
      
      sets.forEach((set: any) => {
        const exercise = exercisesMap.get(set.exercise_id);
        if (!exercise || set.set_type !== 'working') return;
        
        const muscle = exercise.prime_muscle;
        const weekNum = differenceInWeeks(set.created_at, mesoStart) + 1;
        
        if (!heatmapData[muscle]) heatmapData[muscle] = {};
        heatmapData[muscle][weekNum] = (heatmapData[muscle][weekNum] || 0) + 1;
      });

      // Convert to array with status
      const result: VolumeHeatmapData[] = [];
      Object.entries(heatmapData).forEach(([muscle, weeks]) => {
        Object.entries(weeks).forEach(([week, sets]) => {
          const target = 12; // Default target
          const ratio = sets / target;
          let status: 'optimal' | 'attention' | 'problem' = 'optimal';
          
          if (ratio < 0.8 || ratio > 1.2) status = 'problem';
          else if (ratio < 0.9 || ratio > 1.1) status = 'attention';
          
          result.push({
            muscle,
            week: parseInt(week),
            sets,
            target,
            status,
          });
        });
      });

      return result;
    },
    enabled: !!clientId && !!mesocycleId,
  });
}

export function useClientFatigueAlerts(clientId: string) {
  return useQuery<FatigueAlert[]>({
    queryKey: ['clientFatigueAlerts', clientId],
    queryFn: async () => {
      const twoWeeksAgo = subDays(new Date(), 14);
      
      const setsQuery = query(
        collection(db, 'sets'),
        where('user_id', '==', clientId),
        where('created_at', '>=', Timestamp.fromDate(twoWeeksAgo)),
        where('perceived_soreness', '>', 0)
      );
      
      const snapshot = await getDocs(setsQuery);
      const sets = snapshot.docs.map(doc => ({
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
      }));

      // Get exercises
      const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
      const exercisesMap = new Map<string, any>(
        exercisesSnapshot.docs.map(doc => [doc.id, { id: doc.id, name: doc.data().name, ...doc.data() }])
      );

      // Group by exercise
      const fatigueMap: Record<string, { scores: number[]; lastDate: Date }> = {};
      
      sets.forEach((set: any) => {
        if (set.perceived_soreness >= 6) {
          if (!fatigueMap[set.exercise_id]) {
            fatigueMap[set.exercise_id] = { scores: [], lastDate: set.created_at };
          }
          fatigueMap[set.exercise_id].scores.push(set.perceived_soreness);
          if (set.created_at > fatigueMap[set.exercise_id].lastDate) {
            fatigueMap[set.exercise_id].lastDate = set.created_at;
          }
        }
      });

      // Convert to alerts
      return Object.entries(fatigueMap)
        .map(([exerciseId, data]) => {
          const exercise = exercisesMap.get(exerciseId);
          if (!exercise) return null;
          
          const avgSoreness = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
          
          return {
            exerciseId,
            exerciseName: exercise.name,
            avgSoreness: Math.round(avgSoreness * 10) / 10,
            lastWorkout: data.lastDate,
          };
        })
        .filter(Boolean) as FatigueAlert[];
    },
    enabled: !!clientId,
  });
}

export function useClientPRs(clientId: string, days: number = 30) {
  return useQuery<PersonalRecord[]>({
    queryKey: ['clientPRs', clientId, days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      
      const setsQuery = query(
        collection(db, 'sets'),
        where('user_id', '==', clientId),
        where('created_at', '>=', Timestamp.fromDate(startDate)),
        where('set_type', '==', 'working')
      );
      
      const snapshot = await getDocs(setsQuery);
      const sets = snapshot.docs.map(doc => ({
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
      }));

      // Get exercises
      const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
      const exercisesMap = new Map<string, any>(
        exercisesSnapshot.docs.map(doc => [doc.id, { id: doc.id, name: doc.data().name, ...doc.data() }])
      );

      // Calculate e1RM for each set
      const exerciseE1RMs: Record<string, { current: number; previous: number; date: Date }> = {};
      
      sets.forEach((set: any) => {
        const e1rm = calculateE1RMWithRIR(set.load, set.completed_reps, set.rir_actual);
        
        if (!exerciseE1RMs[set.exercise_id]) {
          exerciseE1RMs[set.exercise_id] = { current: e1rm, previous: 0, date: set.created_at };
        } else {
          if (e1rm > exerciseE1RMs[set.exercise_id].current) {
            exerciseE1RMs[set.exercise_id].previous = exerciseE1RMs[set.exercise_id].current;
            exerciseE1RMs[set.exercise_id].current = e1rm;
            exerciseE1RMs[set.exercise_id].date = set.created_at;
          }
        }
      });

      // Convert to PRs with improvements
      return Object.entries(exerciseE1RMs)
        .map(([exerciseId, data]) => {
          const exercise = exercisesMap.get(exerciseId);
          if (!exercise || data.previous === 0) return null;
          
          const improvement = ((data.current - data.previous) / data.previous) * 100;
          if (improvement <= 0) return null;
          
          return {
            exerciseId,
            exerciseName: exercise.name,
            e1rm: data.current,
            previousE1rm: data.previous,
            improvement: Math.round(improvement * 10) / 10,
            date: data.date,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b!.improvement - a!.improvement)
        .slice(0, 5) as PersonalRecord[];
    },
    enabled: !!clientId,
  });
}