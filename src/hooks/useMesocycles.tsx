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
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Mesocycle {
  id: string;
  user_id: string;
  coach_id: string | null;
  name: string;
  start_date: Date;
  length_weeks: number;
  specialization: string[];
  effort_scale: 'RIR' | 'RPE';
  status: 'planned' | 'active' | 'completed' | 'paused';
  created_at: Date;
  updated_at: Date;
  created_by: string;
  last_modified_by: string;
}

export interface WeeklyTarget {
  id: string;
  mesocycle_id: string;
  muscle_id: string;
  week_number: number;
  sets_min: number;
  sets_max: number;
  sets_target: number;
  actual_sets: number;
}

export function useMesocycles(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;
  
  return useQuery({
    queryKey: ['mesocycles', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const q = query(
        collection(db, 'mesocycles'),
        where('user_id', '==', targetUserId),
        orderBy('start_date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        start_date: doc.data().start_date?.toDate(),
        created_at: doc.data().created_at?.toDate(),
        updated_at: doc.data().updated_at?.toDate(),
      })) as Mesocycle[];
    },
    enabled: !!targetUserId,
  });
}

export function useActiveMesocycle(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;
  
  return useQuery({
    queryKey: ['active-mesocycle', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      
      const q = query(
        collection(db, 'mesocycles'),
        where('user_id', '==', targetUserId),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        start_date: doc.data().start_date?.toDate(),
        created_at: doc.data().created_at?.toDate(),
        updated_at: doc.data().updated_at?.toDate(),
      } as Mesocycle;
    },
    enabled: !!targetUserId,
  });
}

export function useWeeklyTargets(mesocycleId: string) {
  return useQuery({
    queryKey: ['weekly-targets', mesocycleId],
    queryFn: async () => {
      const q = query(
        collection(db, 'weekly_targets'),
        where('mesocycle_id', '==', mesocycleId),
        orderBy('week_number', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as WeeklyTarget[];
    },
    enabled: !!mesocycleId,
  });
}

export function useCreateMesocycle() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      user_id: string;
      name: string;
      start_date: Date;
      length_weeks: number;
      specialization: string[];
      effort_scale: 'RIR' | 'RPE';
      targets: Array<{
        muscle_id: string;
        sets_min: number;
        sets_max: number;
        sets_target: number;
      }>;
    }) => {
      const batch = writeBatch(db);
      
      // Create mesocycle
      const mesoRef = doc(collection(db, 'mesocycles'));
      batch.set(mesoRef, {
        user_id: data.user_id,
        coach_id: null,
        name: data.name,
        start_date: data.start_date,
        length_weeks: data.length_weeks,
        specialization: data.specialization,
        effort_scale: data.effort_scale,
        status: 'planned',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        created_by: user?.uid || '',
        last_modified_by: user?.uid || '',
      });
      
      // Create weekly targets with progression
      for (let week = 1; week <= data.length_weeks; week++) {
        for (const target of data.targets) {
          // Progressive overload: 60% → 70% → 80% → 90% → 100% → 50% (deload)
          const progression = 
            week <= 1 ? 0.6 :
            week <= 2 ? 0.7 :
            week <= 3 ? 0.8 :
            week <= 4 ? 0.9 :
            week <= 5 ? 1.0 : 0.5;
          
          const targetRef = doc(collection(db, 'weekly_targets'));
          batch.set(targetRef, {
            mesocycle_id: mesoRef.id,
            muscle_id: target.muscle_id,
            week_number: week,
            sets_min: Math.floor(target.sets_min * progression),
            sets_max: Math.ceil(target.sets_max * progression),
            sets_target: Math.round(target.sets_target * progression),
            actual_sets: 0,
          });
        }
      }
      
      await batch.commit();
      return { id: mesoRef.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesocycles'] });
      toast({
        title: "Mesociclo creado",
        description: "Tu plan de entrenamiento ha sido creado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateMesocycleStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ mesocycleId, status }: { mesocycleId: string; status: string }) => {
      await updateDoc(doc(db, 'mesocycles', mesocycleId), {
        status,
        updated_at: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesocycles'] });
      queryClient.invalidateQueries({ queryKey: ['active-mesocycle'] });
      toast({
        title: "Estado actualizado",
      });
    },
  });
}
