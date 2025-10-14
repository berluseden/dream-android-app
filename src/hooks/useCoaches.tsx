import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useCoachClients() {
  const { user, isCoach } = useAuth();
  
  return useQuery({
    queryKey: ['coach-clients', user?.uid],
    queryFn: async () => {
      if (!isCoach || !user) return [];
      
      const clientsQuery = query(
        collection(db, 'users'),
        where('coach_id', '==', user.uid)
      );
      
      const clientsSnapshot = await getDocs(clientsQuery);
      return clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    },
    enabled: isCoach,
  });
}

export function useAvailableCoaches() {
  return useQuery({
    queryKey: ['available-coaches'],
    queryFn: async () => {
      const rolesQuery = query(
        collection(db, 'user_roles'),
        where('role', '==', 'coach')
      );
      
      const rolesSnapshot = await getDocs(rolesQuery);
      const coachIds = rolesSnapshot.docs.map(doc => doc.data().user_id);
      
      if (coachIds.length === 0) return [];
      
      const coaches = [];
      for (const coachId of coachIds) {
        const coachDoc = await getDocs(query(
          collection(db, 'users'),
          where('__name__', '==', coachId)
        ));
        
        if (!coachDoc.empty) {
          coaches.push({
            id: coachDoc.docs[0].id,
            ...coachDoc.docs[0].data(),
          });
        }
      }
      
      return coaches;
    },
  });
}

export function useAssignCoach() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ coachId, clientId }: { coachId: string; clientId: string }) => {
      await setDoc(doc(collection(db, 'coach_assignments')), {
        coach_id: coachId,
        client_id: clientId,
        assigned_at: new Date(),
        status: 'active',
        notes: '',
      });
      
      await updateDoc(doc(db, 'users', clientId), {
        coach_id: coachId,
        updated_at: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-clients'] });
      queryClient.invalidateQueries({ queryKey: ['available-coaches'] });
      toast({
        title: "Coach asignado",
        description: "El cliente ha sido asignado exitosamente",
      });
    },
  });
}
