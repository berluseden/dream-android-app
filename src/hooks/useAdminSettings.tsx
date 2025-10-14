import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { AdminSettings } from '@/types/admin.types';

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const docRef = doc(db, 'admin_settings', 'global');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as AdminSettings;
      }
      
      // Return defaults if not found
      return {
        id: 'global',
        feature_flags: {
          allow_signup: true,
          coach_can_create_exercises: true,
        },
        units_default: 'kg',
        write_limits: {
          sets_per_minute: 120,
        },
      } as AdminSettings;
    },
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<AdminSettings>) => {
      const docRef = doc(db, 'admin_settings', 'global');
      await setDoc(docRef, data, { merge: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast({
        title: 'Configuración actualizada',
        description: 'Los cambios han sido guardados',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo actualizar la configuración',
      });
    },
  });
}
