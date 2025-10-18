import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, setDoc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import {
  NutritionProfile,
  NutritionEntry,
  NutritionRequirements,
  NutritionCompliance,
  calculateNutritionRequirements,
  analyzeNutritionCompliance,
  suggestCalorieAdjustment,
} from '@/lib/nutrition';
import { subDays, startOfDay } from 'date-fns';
import { useToast } from './use-toast';

/**
 * Hook to get user's nutrition profile
 */
export function useNutritionProfile(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;

  return useQuery<NutritionProfile | null>({
    queryKey: ['nutrition-profile', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;

      const profileRef = doc(db, 'nutrition_profiles', targetUserId);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) return null;

      return {
        user_id: profileDoc.id,
        ...profileDoc.data(),
      } as NutritionProfile;
    },
    enabled: !!targetUserId,
  });
}

/**
 * Hook to get nutrition requirements (calculated from profile)
 */
export function useNutritionRequirements(userId?: string) {
  const { data: profile } = useNutritionProfile(userId);

  return useQuery<NutritionRequirements | null>({
    queryKey: ['nutrition-requirements', userId, profile],
    queryFn: async () => {
      if (!profile) return null;
      return calculateNutritionRequirements(profile);
    },
    enabled: !!profile,
  });
}

/**
 * Hook to get nutrition entries
 */
export function useNutritionEntries(userId?: string, days: number = 14) {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;

  return useQuery<NutritionEntry[]>({
    queryKey: ['nutrition-entries', targetUserId, days],
    queryFn: async () => {
      if (!targetUserId) return [];

      const startDate = startOfDay(subDays(new Date(), days));

      const q = query(
        collection(db, 'nutrition_entries'),
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
      })) as NutritionEntry[];
    },
    enabled: !!targetUserId,
  });
}

/**
 * Hook to get nutrition compliance analysis
 */
export function useNutritionCompliance(userId?: string, days: number = 7) {
  const { data: entries = [] } = useNutritionEntries(userId, days);
  const { data: requirements } = useNutritionRequirements(userId);

  return useQuery<NutritionCompliance | null>({
    queryKey: ['nutrition-compliance', userId, days, entries, requirements],
    queryFn: async () => {
      if (!requirements || entries.length === 0) return null;
      return analyzeNutritionCompliance(entries, requirements);
    },
    enabled: !!requirements && entries.length > 0,
  });
}

/**
 * Hook to create or update nutrition profile
 */
export function useSaveNutritionProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (profile: Omit<NutritionProfile, 'user_id'>) => {
      if (!user?.uid) throw new Error('User not authenticated');

      const profileRef = doc(db, 'nutrition_profiles', user.uid);
      await setDoc(profileRef, {
        user_id: user.uid,
        ...profile,
      });

      return { id: user.uid };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-profile'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-requirements'] });
      toast({
        title: 'Perfil nutricional guardado',
        description: 'Tus requerimientos han sido actualizados.',
      });
    },
  });
}

/**
 * Hook to log daily nutrition
 */
export function useLogNutrition() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<NutritionEntry, 'id' | 'user_id' | 'created_at'>) => {
      if (!user?.uid) throw new Error('User not authenticated');

      const today = startOfDay(new Date());
      const entryId = `${user.uid}_${today.toISOString().split('T')[0]}`;

      const entryRef = doc(db, 'nutrition_entries', entryId);
      await setDoc(entryRef, {
        user_id: user.uid,
        date: today,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs || 0,
        fats: data.fats || 0,
        bodyweight: data.bodyweight || null,
        notes: data.notes || '',
        created_at: new Date(),
      });

      return { id: entryId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-entries'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-compliance'] });
      toast({
        title: 'Nutrición registrada',
        description: 'Datos guardados correctamente.',
      });
    },
  });
}

/**
 * Hook to get today's nutrition entry (if exists)
 */
export function useTodayNutrition() {
  const { user } = useAuth();

  return useQuery<NutritionEntry | null>({
    queryKey: ['today-nutrition', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;

      const today = startOfDay(new Date());
      const entryId = `${user.uid}_${today.toISOString().split('T')[0]}`;

      const entryRef = doc(db, 'nutrition_entries', entryId);
      const entryDoc = await getDoc(entryRef);

      if (!entryDoc.exists()) return null;

      const data = entryDoc.data();
      return {
        id: entryDoc.id,
        ...data,
        date: data.date?.toDate(),
        created_at: data.created_at?.toDate(),
      } as NutritionEntry;
    },
    enabled: !!user?.uid,
  });
}

/**
 * Hook to get calorie adjustment suggestion
 */
export function useCalorieAdjustment(userId?: string) {
  const { data: entries = [] } = useNutritionEntries(userId, 28); // 4 weeks
  const { data: profile } = useNutritionProfile(userId);
  const { data: compliance } = useNutritionCompliance(userId, 7);

  return useQuery({
    queryKey: ['calorie-adjustment', userId, entries, profile, compliance],
    queryFn: async () => {
      if (!profile || !compliance) return null;

      const weighIns = entries
        .filter(e => e.bodyweight != null)
        .map(e => ({ date: e.date, bodyweight: e.bodyweight! }));

      return suggestCalorieAdjustment(
        weighIns,
        profile.goal,
        compliance.avgCalories
      );
    },
    enabled: !!profile && !!compliance && entries.length > 0,
  });
}
