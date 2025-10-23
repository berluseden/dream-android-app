import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
  muscle_focus?: string[]; // NEW
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
      // Solo usar templates de Firestore (no fallback a locales)
      let q = query(collection(db, 'templates'), where('is_public', '==', true));
      const snapshot = await getDocs(q);
      let programs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as ProgramTemplate[];

      // Normalizar estructura
      programs = programs.map(p => normalizeFirestoreTemplate(p));
      
      // Aplicar filtros
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
      
      // Ordenar por rating y uso
      programs.sort((a, b) => {
        const scoreA = (a.rating_avg || 0) * (a.rating_count || 1) + (a.times_used || 0) * 0.1;
        const scoreB = (b.rating_avg || 0) * (b.rating_count || 1) + (b.times_used || 0) * 0.1;
        return scoreB - scoreA;
      });
      
      return programs;
    },
  });
}

// Normalizar estructura de template de Firestore
function normalizeFirestoreTemplate(p: any) {
  const sessions = (p.sessions || []).map((s: any) => ({
    name: s.name || 'Sesión',
    blocks: (s.blocks || []).map((b: any) => ({
      exercise_name: b.exercise_name || b.exercise || 'Ejercicio',
      sets: b.sets,
      rep_range_min: b.rep_range_min || b.rep_range?.[0] || 8,
      rep_range_max: b.rep_range_max || b.rep_range?.[1] || 12,
      rir_target: b.rir_target ?? 1,
      rest_seconds: b.rest_seconds ?? 90,
    })),
  }));

  return {
    ...p,
    sessions,
  };
}

export function useCloneTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      // This would create a new mesocycle based on the template
      // Implementation depends on your mesocycle creation logic
      
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

/**
 * Hook para obtener un template específico por ID (solo Firestore)
 */
export function useTemplate(templateId: string | undefined) {
  return useQuery<ProgramTemplate | null>({
    queryKey: ['template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      
      const q = query(collection(db, 'templates'), where('__name__', '==', templateId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      const program = { id: doc.id, ...doc.data() } as ProgramTemplate;
      return normalizeFirestoreTemplate(program);
    },
    enabled: !!templateId,
  });
}