import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

export async function seedMuscles() {
  const muscles = [
    { name: 'chest', display_name: 'Pecho', category: 'upper' },
    { name: 'back', display_name: 'Espalda', category: 'upper' },
    { name: 'shoulders', display_name: 'Hombros', category: 'upper' },
    { name: 'biceps', display_name: 'Bíceps', category: 'upper' },
    { name: 'triceps', display_name: 'Tríceps', category: 'upper' },
    { name: 'quads', display_name: 'Cuádriceps', category: 'lower' },
    { name: 'hamstrings', display_name: 'Isquiotibiales', category: 'lower' },
    { name: 'glutes', display_name: 'Glúteos', category: 'lower' },
    { name: 'calves', display_name: 'Pantorrillas', category: 'lower' },
    { name: 'abs', display_name: 'Abdominales', category: 'core' },
  ];
  
  const batch = writeBatch(db);
  const muscleIds: Record<string, string> = {};
  
  for (const muscle of muscles) {
    const ref = doc(collection(db, 'muscles'));
    batch.set(ref, muscle);
    muscleIds[muscle.name] = ref.id;
  }
  
  await batch.commit();
  return muscleIds;
}

export async function seedExercises(muscleIds: Record<string, string>) {
  const exercises = [
    {
      name: 'Press de Banca Plano',
      prime_muscle: muscleIds.chest,
      secondary_muscles: [muscleIds.triceps, muscleIds.shoulders],
      equipment: ['barbell'],
      difficulty: 'intermediate',
      is_compound: true,
      description: 'Ejercicio fundamental para desarrollo de pecho',
      instructions: 'Acostado en banco plano, bajar barra al pecho y empujar con control',
      created_by: null,
    },
    {
      name: 'Sentadilla con Barra',
      prime_muscle: muscleIds.quads,
      secondary_muscles: [muscleIds.glutes, muscleIds.hamstrings],
      equipment: ['barbell', 'rack'],
      difficulty: 'advanced',
      is_compound: true,
      description: 'Rey de los ejercicios de pierna',
      instructions: 'Bajar controlado manteniendo espalda recta, empujar con piernas',
      created_by: null,
    },
    {
      name: 'Peso Muerto',
      prime_muscle: muscleIds.back,
      secondary_muscles: [muscleIds.hamstrings, muscleIds.glutes],
      equipment: ['barbell'],
      difficulty: 'advanced',
      is_compound: true,
      description: 'Ejercicio completo de cadena posterior',
      instructions: 'Mantener espalda neutral, empujar con piernas',
      created_by: null,
    },
    {
      name: 'Dominadas',
      prime_muscle: muscleIds.back,
      secondary_muscles: [muscleIds.biceps],
      equipment: ['bodyweight', 'pull-up-bar'],
      difficulty: 'intermediate',
      is_compound: true,
      description: 'Ejercicio de espalda con peso corporal',
      instructions: 'Colgar de barra, jalar hasta barbilla sobre barra',
      created_by: null,
    },
    {
      name: 'Press Militar',
      prime_muscle: muscleIds.shoulders,
      secondary_muscles: [muscleIds.triceps],
      equipment: ['barbell'],
      difficulty: 'intermediate',
      is_compound: true,
      description: 'Press vertical para hombros',
      instructions: 'Empujar barra desde hombros hasta brazos extendidos',
      created_by: null,
    },
    {
      name: 'Curl con Barra',
      prime_muscle: muscleIds.biceps,
      secondary_muscles: [],
      equipment: ['barbell'],
      difficulty: 'beginner',
      is_compound: false,
      description: 'Ejercicio básico de bíceps',
      instructions: 'Flexionar codos manteniendo torso estable',
      created_by: null,
    },
    {
      name: 'Press Francés',
      prime_muscle: muscleIds.triceps,
      secondary_muscles: [],
      equipment: ['barbell', 'ez-bar'],
      difficulty: 'intermediate',
      is_compound: false,
      description: 'Extensión de tríceps acostado',
      instructions: 'Extender brazos desde posición flexionada',
      created_by: null,
    },
    {
      name: 'Remo con Barra',
      prime_muscle: muscleIds.back,
      secondary_muscles: [muscleIds.biceps],
      equipment: ['barbell'],
      difficulty: 'intermediate',
      is_compound: true,
      description: 'Remo horizontal para espalda',
      instructions: 'Jalar barra hacia abdomen manteniendo torso estable',
      created_by: null,
    },
  ];
  
  const batch = writeBatch(db);
  
  for (const exercise of exercises) {
    const ref = doc(collection(db, 'exercises'));
    batch.set(ref, exercise);
  }
  
  await batch.commit();
}

/**
 * Migra todos los templates locales a Firestore
 */
export async function seedTemplates() {
  const localTemplates = [
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
  ];

  const batch = writeBatch(db);
  const templateIds: string[] = [];

  for (const tpl of localTemplates) {
    // Normalizar estructura del template
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

    const normalizedTemplate = {
      name: tpl.name || 'Programa Sin Nombre',
      description: tpl.description || '',
      split: tpl.name || 'Split Custom',
      weeks: (tpl as any).length_weeks || 6,
      days_per_week: (tpl as any).frequency || (tpl as any).days?.length || 4,
      level: (tpl as any).level === 'intermedio' ? 'intermediate' : (tpl as any).level || 'intermediate',
      required_equipment: (tpl as any).required_equipment || [],
      muscle_focus: (tpl as any).muscle_focus || [],
      focus: (tpl as any).focus || 'hypertrophy',
      rating_avg: 4.8,
      rating_count: 120,
      times_used: 840,
      sessions,
      is_public: true,
      created_at: new Date(),
    };

    const ref = doc(collection(db, 'templates'));
    batch.set(ref, normalizedTemplate);
    templateIds.push(ref.id);
    console.log(`✅ Template "${tpl.name}" preparado con ID: ${ref.id}`);
  }

  await batch.commit();
  console.log(`✅ ${templateIds.length} templates migrados a Firestore`);
  return templateIds;
}

export async function runSeed() {
  try {
    const muscleIds = await seedMuscles();
    await seedExercises(muscleIds);
    await seedTemplates();
    return { success: true, message: 'Seed completado exitosamente' };
  } catch (error) {
    console.error('Error en seed:', error);
    return { success: false, message: 'Error en seed', error };
  }
}
