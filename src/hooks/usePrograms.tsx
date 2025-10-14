import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

export interface ProgramFilters {
  days?: number[];
  level?: string[];
  equipment?: string[];
  focus?: string[];
}

export interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  split: string;
  weeks: number;
  days_per_week: number;
  level?: string;
  required_equipment?: string[];
  focus?: string;
  rating_avg?: number;
  rating_count?: number;
  times_used?: number;
  sessions: any[];
}

export function usePrograms(filters: ProgramFilters) {
  return useQuery<ProgramTemplate[]>({
    queryKey: ['programs', filters],
    queryFn: async () => {
      let q = query(collection(db, 'templates'));
      
      // Note: Complex filtering would require composite indexes
      // For now, we'll fetch all and filter in memory
      const snapshot = await getDocs(q);
      let programs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ProgramTemplate[];
      
      // Apply filters
      if (filters.days && filters.days.length > 0) {
        programs = programs.filter(p => filters.days!.includes(p.days_per_week));
      }
      
      if (filters.level && filters.level.length > 0) {
        programs = programs.filter(p => p.level && filters.level!.includes(p.level));
      }
      
      if (filters.equipment && filters.equipment.length > 0) {
        programs = programs.filter(p =>
          p.required_equipment?.some(eq => filters.equipment!.includes(eq))
        );
      }
      
      if (filters.focus && filters.focus.length > 0) {
        programs = programs.filter(p => p.focus && filters.focus!.includes(p.focus));
      }
      
      // Sort by rating and usage
      programs.sort((a, b) => {
        const scoreA = (a.rating_avg || 0) * (a.rating_count || 1) + (a.times_used || 0) * 0.1;
        const scoreB = (b.rating_avg || 0) * (b.rating_count || 1) + (b.times_used || 0) * 0.1;
        return scoreB - scoreA;
      });
      
      return programs;
    },
  });
}

export function useCloneTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      // This would create a new mesocycle based on the template
      // Implementation depends on your mesocycle creation logic
      console.log('Cloning template:', templateId);
      
      // Placeholder - actual implementation would create mesocycle
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Programa clonado',
        description: 'El programa se ha agregado a tu lista',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo clonar el programa',
        variant: 'destructive',
      });
      console.error('Error cloning template:', error);
    },
  });
}