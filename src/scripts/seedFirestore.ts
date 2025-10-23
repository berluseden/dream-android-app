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
    // PECHO
    { name: 'Press de Banca Plano', prime_muscle: muscleIds.chest, secondary_muscles: [muscleIds.triceps, muscleIds.shoulders], equipment: ['barbell'], difficulty: 'intermediate', is_compound: true },
    { name: 'Press Inclinado con Barra', prime_muscle: muscleIds.chest, secondary_muscles: [muscleIds.triceps, muscleIds.shoulders], equipment: ['barbell'], difficulty: 'intermediate', is_compound: true },
    { name: 'Press con Mancuernas Plano', prime_muscle: muscleIds.chest, secondary_muscles: [muscleIds.triceps], equipment: ['dumbbell'], difficulty: 'beginner', is_compound: true },
    { name: 'Press Inclinado con Mancuernas', prime_muscle: muscleIds.chest, secondary_muscles: [muscleIds.triceps], equipment: ['dumbbell'], difficulty: 'beginner', is_compound: true },
    { name: 'Aperturas con Mancuernas', prime_muscle: muscleIds.chest, secondary_muscles: [], equipment: ['dumbbell'], difficulty: 'beginner', is_compound: false },
    { name: 'Cruce de Cables', prime_muscle: muscleIds.chest, secondary_muscles: [], equipment: ['cable'], difficulty: 'beginner', is_compound: false },
    
    // ESPALDA
    { name: 'Peso Muerto', prime_muscle: muscleIds.back, secondary_muscles: [muscleIds.hamstrings, muscleIds.glutes], equipment: ['barbell'], difficulty: 'advanced', is_compound: true },
    { name: 'Peso Muerto Rumano', prime_muscle: muscleIds.hamstrings, secondary_muscles: [muscleIds.back, muscleIds.glutes], equipment: ['barbell'], difficulty: 'intermediate', is_compound: true },
    { name: 'Dominadas', prime_muscle: muscleIds.back, secondary_muscles: [muscleIds.biceps], equipment: ['bodyweight'], difficulty: 'intermediate', is_compound: true },
    { name: 'Dominadas Agarre Neutro', prime_muscle: muscleIds.back, secondary_muscles: [muscleIds.biceps], equipment: ['bodyweight'], difficulty: 'intermediate', is_compound: true },
    { name: 'Remo con Barra', prime_muscle: muscleIds.back, secondary_muscles: [muscleIds.biceps], equipment: ['barbell'], difficulty: 'intermediate', is_compound: true },
    { name: 'Remo con Mancuerna', prime_muscle: muscleIds.back, secondary_muscles: [muscleIds.biceps], equipment: ['dumbbell'], difficulty: 'beginner', is_compound: true },
    { name: 'Jalón al Pecho', prime_muscle: muscleIds.back, secondary_muscles: [muscleIds.biceps], equipment: ['cable'], difficulty: 'beginner', is_compound: true },
    { name: 'Remo en Polea Baja', prime_muscle: muscleIds.back, secondary_muscles: [muscleIds.biceps], equipment: ['cable'], difficulty: 'beginner', is_compound: true },
    { name: 'Pull-over con Mancuerna', prime_muscle: muscleIds.back, secondary_muscles: [muscleIds.chest], equipment: ['dumbbell'], difficulty: 'intermediate', is_compound: false },
    
    // HOMBROS
    { name: 'Press Militar', prime_muscle: muscleIds.shoulders, secondary_muscles: [muscleIds.triceps], equipment: ['barbell'], difficulty: 'intermediate', is_compound: true },
    { name: 'Press con Mancuernas Sentado', prime_muscle: muscleIds.shoulders, secondary_muscles: [muscleIds.triceps], equipment: ['dumbbell'], difficulty: 'beginner', is_compound: true },
    { name: 'Press en Máquina', prime_muscle: muscleIds.shoulders, secondary_muscles: [muscleIds.triceps], equipment: ['machine'], difficulty: 'beginner', is_compound: true },
    { name: 'Elevaciones Laterales', prime_muscle: muscleIds.shoulders, secondary_muscles: [], equipment: ['dumbbell'], difficulty: 'beginner', is_compound: false },
    { name: 'Elevaciones Frontales', prime_muscle: muscleIds.shoulders, secondary_muscles: [], equipment: ['dumbbell'], difficulty: 'beginner', is_compound: false },
    { name: 'Pájaros con Mancuernas', prime_muscle: muscleIds.shoulders, secondary_muscles: [muscleIds.back], equipment: ['dumbbell'], difficulty: 'beginner', is_compound: false },
    { name: 'Face Pulls', prime_muscle: muscleIds.shoulders, secondary_muscles: [muscleIds.back], equipment: ['cable'], difficulty: 'beginner', is_compound: false },
    
    // PIERNAS - CUÁDRICEPS
    { name: 'Sentadilla con Barra', prime_muscle: muscleIds.quads, secondary_muscles: [muscleIds.glutes, muscleIds.hamstrings], equipment: ['barbell'], difficulty: 'advanced', is_compound: true },
    { name: 'Sentadilla Frontal', prime_muscle: muscleIds.quads, secondary_muscles: [muscleIds.glutes], equipment: ['barbell'], difficulty: 'advanced', is_compound: true },
    { name: 'Prensa de Piernas', prime_muscle: muscleIds.quads, secondary_muscles: [muscleIds.glutes, muscleIds.hamstrings], equipment: ['machine'], difficulty: 'beginner', is_compound: true },
    { name: 'Extensiones de Cuádriceps', prime_muscle: muscleIds.quads, secondary_muscles: [], equipment: ['machine'], difficulty: 'beginner', is_compound: false },
    { name: 'Zancadas con Mancuernas', prime_muscle: muscleIds.quads, secondary_muscles: [muscleIds.glutes], equipment: ['dumbbell'], difficulty: 'intermediate', is_compound: true },
    { name: 'Sentadilla Búlgara', prime_muscle: muscleIds.quads, secondary_muscles: [muscleIds.glutes], equipment: ['dumbbell'], difficulty: 'intermediate', is_compound: true },
    { name: 'Hack Squat', prime_muscle: muscleIds.quads, secondary_muscles: [muscleIds.glutes], equipment: ['machine'], difficulty: 'intermediate', is_compound: true },
    
    // PIERNAS - ISQUIOTIBIALES
    { name: 'Curl Femoral Acostado', prime_muscle: muscleIds.hamstrings, secondary_muscles: [], equipment: ['machine'], difficulty: 'beginner', is_compound: false },
    { name: 'Curl Femoral Sentado', prime_muscle: muscleIds.hamstrings, secondary_muscles: [], equipment: ['machine'], difficulty: 'beginner', is_compound: false },
    { name: 'Buenos Días', prime_muscle: muscleIds.hamstrings, secondary_muscles: [muscleIds.back, muscleIds.glutes], equipment: ['barbell'], difficulty: 'intermediate', is_compound: true },
    
    // PIERNAS - GLÚTEOS
    { name: 'Hip Thrust', prime_muscle: muscleIds.glutes, secondary_muscles: [muscleIds.hamstrings], equipment: ['barbell'], difficulty: 'intermediate', is_compound: true },
    { name: 'Peso Muerto Sumo', prime_muscle: muscleIds.glutes, secondary_muscles: [muscleIds.quads, muscleIds.hamstrings], equipment: ['barbell'], difficulty: 'intermediate', is_compound: true },
    
    // PANTORRILLAS
    { name: 'Elevación de Talones de Pie', prime_muscle: muscleIds.calves, secondary_muscles: [], equipment: ['machine'], difficulty: 'beginner', is_compound: false },
    { name: 'Elevación de Talones Sentado', prime_muscle: muscleIds.calves, secondary_muscles: [], equipment: ['machine'], difficulty: 'beginner', is_compound: false },
    
    // BÍCEPS
    { name: 'Curl con Barra', prime_muscle: muscleIds.biceps, secondary_muscles: [], equipment: ['barbell'], difficulty: 'beginner', is_compound: false },
    { name: 'Curl con Mancuernas', prime_muscle: muscleIds.biceps, secondary_muscles: [], equipment: ['dumbbell'], difficulty: 'beginner', is_compound: false },
    { name: 'Curl Martillo', prime_muscle: muscleIds.biceps, secondary_muscles: [], equipment: ['dumbbell'], difficulty: 'beginner', is_compound: false },
    { name: 'Curl en Polea', prime_muscle: muscleIds.biceps, secondary_muscles: [], equipment: ['cable'], difficulty: 'beginner', is_compound: false },
    { name: 'Curl Predicador', prime_muscle: muscleIds.biceps, secondary_muscles: [], equipment: ['barbell'], difficulty: 'intermediate', is_compound: false },
    
    // TRÍCEPS
    { name: 'Press Francés', prime_muscle: muscleIds.triceps, secondary_muscles: [], equipment: ['barbell'], difficulty: 'intermediate', is_compound: false },
    { name: 'Fondos en Paralelas', prime_muscle: muscleIds.triceps, secondary_muscles: [muscleIds.chest], equipment: ['bodyweight'], difficulty: 'intermediate', is_compound: true },
    { name: 'Extensión de Tríceps en Polea', prime_muscle: muscleIds.triceps, secondary_muscles: [], equipment: ['cable'], difficulty: 'beginner', is_compound: false },
    { name: 'Patada de Tríceps', prime_muscle: muscleIds.triceps, secondary_muscles: [], equipment: ['dumbbell'], difficulty: 'beginner', is_compound: false },
    { name: 'Press Cerrado', prime_muscle: muscleIds.triceps, secondary_muscles: [muscleIds.chest], equipment: ['barbell'], difficulty: 'intermediate', is_compound: true },
    
    // ABDOMINALES
    { name: 'Crunch Abdominal', prime_muscle: muscleIds.abs, secondary_muscles: [], equipment: ['bodyweight'], difficulty: 'beginner', is_compound: false },
    { name: 'Elevación de Piernas', prime_muscle: muscleIds.abs, secondary_muscles: [], equipment: ['bodyweight'], difficulty: 'intermediate', is_compound: false },
    { name: 'Plancha Abdominal', prime_muscle: muscleIds.abs, secondary_muscles: [], equipment: ['bodyweight'], difficulty: 'beginner', is_compound: false },
    { name: 'Russian Twist', prime_muscle: muscleIds.abs, secondary_muscles: [], equipment: ['bodyweight'], difficulty: 'intermediate', is_compound: false },
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

/**
 * Ejecuta todas las migraciones en el orden correcto
 */
export async function runSeed() {
  try {
    console.log('🚀 Iniciando seed completo...');
    
    const muscleIds = await seedMuscles();
    console.log(`✅ ${Object.keys(muscleIds).length} músculos creados`);
    
    await seedExercises(muscleIds);
    console.log('✅ ~50 ejercicios creados');
    
    const templateIds = await seedTemplates();
    console.log(`✅ ${templateIds.length} templates migrados`);
    
    return { 
      success: true, 
      message: 'Seed completado exitosamente',
      details: {
        muscles: Object.keys(muscleIds).length,
        exercises: 50,
        templates: templateIds.length,
      }
    };
  } catch (error) {
    console.error('❌ Error en seed:', error);
    return { success: false, message: 'Error en seed', error };
  }
}
