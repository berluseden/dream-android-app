import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, query, where, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { StrengthProfile, MovementPattern } from '@/types/strength.types';
import { calculateE1RMWithRIR } from '@/lib/algorithms';
import { toast } from '@/hooks/use-toast';

export function useStrengthProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery<StrengthProfile[]>({
    queryKey: ['strengthProfile', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      
      const q = query(
        collection(db, 'user_strength_profile'),
        where('user_id', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        last_calibration_date: doc.data().last_calibration_date?.toDate(),
      })) as StrengthProfile[];
    },
    enabled: !!user,
  });

  const saveCalibration = useMutation({
    mutationFn: async (data: {
      pattern: MovementPattern;
      load: number;
      reps: number;
      rir: number;
    }) => {
      if (!user) throw new Error('No user');

      const e1rm = calculateE1RMWithRIR(data.load, data.reps, data.rir);
      const docId = `${user.uid}_${data.pattern}`;

      await setDoc(doc(db, 'user_strength_profile', docId), {
        user_id: user.uid,
        pattern: data.pattern,
        e1rm,
        last_calibration_date: Timestamp.now(),
        calibration_data: {
          load: data.load,
          reps: data.reps,
          rir: data.rir,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strengthProfile'] });
      toast({
        title: 'Calibración guardada',
        description: 'Tu perfil de fuerza ha sido actualizado',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la calibración',
        variant: 'destructive',
      });
      console.error('Error saving calibration:', error);
    },
  });

  const getE1RMForPattern = (pattern: MovementPattern): number | null => {
    const profile = profiles?.find(p => p.pattern === pattern);
    return profile?.e1rm ?? null;
  };

  const hasCompletedCalibration = (): boolean => {
    return (profiles?.length ?? 0) >= 4;
  };

  return {
    profiles,
    isLoading,
    saveCalibration,
    getE1RMForPattern,
    hasCompletedCalibration,
  };
}
