import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { toast } from '@/hooks/use-toast';
import { BackupJob, BackupScope } from '@/types/admin.types';
import { seedTemplates } from '@/scripts/seedFirestore';

export function useBackupJobs() {
  return useQuery({
    queryKey: ['admin', 'backups'],
    queryFn: async () => {
      const q = query(collection(db, 'backups'), orderBy('started_at', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as BackupJob[];
    },
  });
}

export function useTriggerBackup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scope: BackupScope) => {
      const backupCollections = httpsCallable(functions, 'backupCollections');
      const result = await backupCollections({ scope });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'backups'] });
      toast({
        title: 'Backup iniciado',
        description: 'El proceso de backup ha comenzado',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo iniciar el backup',
      });
    },
  });
}

export function useReindexFields() {
  return useMutation({
    mutationFn: async () => {
      const reindexComputedFields = httpsCallable(functions, 'reindexComputedFields');
      const result = await reindexComputedFields();
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: 'Reindexación completada',
        description: 'Los campos calculados han sido actualizados',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo completar la reindexación',
      });
    },
  });
}

export function useSeedCatalogs() {
  return useMutation({
    mutationFn: async () => {
      // Ejecutar migración local de templates
      const result = await seedTemplates();
      return { success: true, templateIds: result };
    },
    onSuccess: (data) => {
      toast({
        title: 'Templates migrados exitosamente',
        description: `${data.templateIds.length} programas han sido cargados a Firestore`,
      });
    },
    onError: (error: any) => {
      console.error('Error migrando templates:', error);
      toast({
        variant: 'destructive',
        title: 'Error en migración',
        description: error.message || 'No se pudieron migrar los templates',
      });
    },
  });
}
