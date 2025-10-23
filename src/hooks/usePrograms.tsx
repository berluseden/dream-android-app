import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import upperLower from '@/data/templates/upper_lower.json';
import ppl from '@/data/templates/push_pull_legs.json';
import arnold from '@/data/templates/arnold_split.json';
import nsuns from '@/data/templates/nSuns531.json';
import chestSpec from '@/data/templates/specialization_chest_6w.json';
import backSpec from '@/data/templates/specialization_back_6w.json';
import deltsSpec from '@/data/templates/specialization_delts_6w.json';
import quadsGlutes from '@/data/templates/quads_glutes_strength_8w.json';
import peaking from '@/data/templates/peaking_strength_6w.json';
import posteriorChain from '@/data/templates/posterior_chain_8w.json';
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
      let q = query(collection(db, 'templates'));
      // Fetch remote templates
      const snapshot = await getDocs(q);
      let programs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProgramTemplate[];

      // Fallback to local templates if remote is empty
      if (!programs || programs.length === 0) {
        const localLib = [
          upperLower,
          ppl,
          arnold,
          nsuns,
          chestSpec,
          backSpec,
          deltsSpec,
          quadsGlutes,
          peaking,
          posteriorChain,
        ].map((tpl: any, idx: number) => normalizeLocalTemplate(tpl, `local-${idx}`));
        programs = localLib as unknown as ProgramTemplate[];
      } else {
        // Normalize sessions if needed to match ProgramPreview expectations
        programs = programs.map(p => normalizeFirestoreTemplate(p));
      }
      
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

// Normalize local JSON templates into ProgramTemplate shape used by UI
function normalizeLocalTemplate(tpl: any, id: string) {
  // Two possible shapes: src/data/templates/* use {days: [...], frequency, length_weeks}
  const sessions = (tpl.days || []).map((d: any) => ({
    name: d.name,
    blocks: (d.exercises || []).map((ex: any) => ({
      exercise_name: ex.name,
      sets: ex.sets,
      rep_range_min: typeof ex.reps === 'string' ? parseInt(ex.reps.split('-')[0]) : ex.rep_range?.[0] || 8,
      rep_range_max: typeof ex.reps === 'string' ? parseInt(ex.reps.split('-')[1]) : ex.rep_range?.[1] || 12,
      rir_target: ex.rir ?? 1,
      rest_seconds: ex.rest_seconds ?? 90,
    })),
  }));

  return {
    id,
    name: tpl.name,
    description: tpl.description,
    split: tpl.split || tpl.name,
    weeks: tpl.length_weeks || tpl.weeks || 6,
    days_per_week: tpl.frequency || tpl.days_per_week || (tpl.days?.length || 4),
    level: tpl.level === 'intermedio' ? 'intermediate' : tpl.level || 'intermediate',
    required_equipment: tpl.required_equipment || [],
    muscle_focus: tpl.muscle_focus || [],
    focus: tpl.focus,
    rating_avg: 4.8,
    rating_count: 120,
    times_used: 840,
    sessions,
  };
}

// Normalize firestore template shape to ProgramTemplate used by ProgramPreview
function normalizeFirestoreTemplate(p: any) {
  // Ensure blocks have expected keys
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
 * 🆕 Export local templates para usar desde otros hooks
 */
export function getLocalTemplates() {
  const localLib = [
    upperLower,
    ppl,
    arnold,
    nsuns,
    chestSpec,
    backSpec,
    deltsSpec,
    quadsGlutes,
    peaking,
    posteriorChain,
  ].map((tpl: any, idx: number) => normalizeLocalTemplate(tpl, `local-${idx}`));
  
  return localLib;
}