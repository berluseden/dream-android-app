import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { toast } from '@/hooks/use-toast';
import { Invitation } from '@/types/admin.types';

export function useInvitations() {
  return useQuery({
    queryKey: ['admin', 'invitations'],
    queryFn: async () => {
      const q = query(collection(db, 'invitations'), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Invitation[];
    },
  });
}

export function useSendInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      const sendInvitation = httpsCallable(functions, 'sendInvitation');
      const result = await sendInvitation(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invitations'] });
      toast({
        title: 'Invitación enviada',
        description: 'La invitación ha sido enviada exitosamente',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo enviar la invitación',
      });
    },
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invitationId: string) => {
      const revokeInvitation = httpsCallable(functions, 'revokeInvitation');
      const result = await revokeInvitation({ invitationId });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invitations'] });
      toast({
        title: 'Invitación revocada',
        description: 'La invitación ha sido revocada',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo revocar la invitación',
      });
    },
  });
}
