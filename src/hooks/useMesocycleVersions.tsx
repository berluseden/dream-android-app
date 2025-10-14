import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface MesocycleVersion {
  id: string;
  mesocycle_id: string;
  version: number;
  changelog: string;
  changes: {
    type: 'volume' | 'exercise' | 'schedule' | 'other';
    description: string;
    affected_weeks?: number[];
  }[];
  created_at: Date;
  created_by: string;
}

export function useMesocycleVersions(mesocycleId: string) {
  return useQuery<MesocycleVersion[]>({
    queryKey: ['mesocycleVersions', mesocycleId],
    queryFn: async () => {
      if (!mesocycleId) return [];
      
      const q = query(
        collection(db, 'mesocycle_versions'),
        where('mesocycle_id', '==', mesocycleId),
        orderBy('created_at', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
      })) as MesocycleVersion[];
    },
    enabled: !!mesocycleId,
  });
}

export function useLatestVersion(mesocycleId: string) {
  return useQuery<MesocycleVersion | null>({
    queryKey: ['latestMesocycleVersion', mesocycleId],
    queryFn: async () => {
      if (!mesocycleId) return null;
      
      const q = query(
        collection(db, 'mesocycle_versions'),
        where('mesocycle_id', '==', mesocycleId),
        orderBy('created_at', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
      } as MesocycleVersion;
    },
    enabled: !!mesocycleId,
  });
}

export function useCreateVersion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      mesocycle_id: string;
      changelog: string;
      changes: MesocycleVersion['changes'];
    }) => {
      if (!user) throw new Error('No user');

      // Get current max version
      const versionsQuery = query(
        collection(db, 'mesocycle_versions'),
        where('mesocycle_id', '==', data.mesocycle_id),
        orderBy('version', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(versionsQuery);
      const currentVersion = snapshot.empty ? 0 : snapshot.docs[0].data().version;

      await addDoc(collection(db, 'mesocycle_versions'), {
        mesocycle_id: data.mesocycle_id,
        version: currentVersion + 1,
        changelog: data.changelog,
        changes: data.changes,
        created_at: Timestamp.now(),
        created_by: user.uid,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mesocycleVersions', variables.mesocycle_id] });
      queryClient.invalidateQueries({ queryKey: ['latestMesocycleVersion', variables.mesocycle_id] });
      toast({
        title: 'Versión publicada',
        description: 'Los cambios han sido publicados y notificados al cliente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo publicar la versión',
        variant: 'destructive',
      });
      console.error('Error creating version:', error);
    },
  });
}