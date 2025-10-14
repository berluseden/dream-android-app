import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Exercise, Muscle } from '@/types/user.types';

export function useExercises(filters?: {
  muscleId?: string;
  equipment?: string[];
  difficulty?: string;
}) {
  return useQuery({
    queryKey: ['exercises', filters],
    queryFn: async () => {
      let q = query(collection(db, 'exercises'), orderBy('name'));
      
      if (filters?.muscleId) {
        q = query(q, where('prime_muscle', '==', filters.muscleId));
      }
      
      if (filters?.difficulty) {
        q = query(q, where('difficulty', '==', filters.difficulty));
      }
      
      const snapshot = await getDocs(q);
      const exercises = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Exercise[];
      
      if (filters?.equipment && filters.equipment.length > 0) {
        return exercises.filter(ex =>
          ex.equipment.some(eq => filters.equipment!.includes(eq))
        );
      }
      
      return exercises;
    },
  });
}

export function useMuscles() {
  return useQuery({
    queryKey: ['muscles'],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, 'muscles'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Muscle[];
    },
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  const { user, isAdmin, isCoach } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (exercise: Omit<Exercise, 'id'>) => {
      if (!isAdmin && !isCoach) {
        throw new Error('No autorizado');
      }
      
      const newExerciseRef = doc(collection(db, 'exercises'));
      await setDoc(newExerciseRef, {
        ...exercise,
        created_by: user?.uid || null,
      });
      
      return { id: newExerciseRef.id, ...exercise };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast({
        title: "Ejercicio creado",
        description: "El ejercicio se añadió correctamente",
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

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (exerciseId: string) => {
      if (!isAdmin) {
        throw new Error('Solo administradores pueden eliminar ejercicios');
      }
      
      await deleteDoc(doc(db, 'exercises', exerciseId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast({
        title: "Ejercicio eliminado",
      });
    },
  });
}
