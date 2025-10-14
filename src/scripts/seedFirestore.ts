import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

export async function runSeed() {
  try {
    const muscleIds = await seedMuscles();
    await seedExercises(muscleIds);
    return { success: true, message: 'Seed completado exitosamente' };
  } catch (error) {
    console.error('Error en seed:', error);
    return { success: false, message: 'Error en seed', error };
  }
}
