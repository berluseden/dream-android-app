import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createAuditLog } from './audit';

const db = admin.firestore();

// Helper to check if caller is admin
async function requireAdmin(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  const roleDoc = await db.collection('user_roles').doc(context.auth.uid).get();
  const role = roleDoc.data()?.role;
  
  if (role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Solo administradores pueden realizar esta acción');
  }
  
  return context.auth.uid;
}

// Seed muscles
async function seedMuscles() {
  const muscles = [
    { name: 'chest', display_name: 'Pecho', category: 'upper' },
    { name: 'back', display_name: 'Espalda', category: 'upper' },
    { name: 'shoulders', display_name: 'Hombros', category: 'upper' },
    { name: 'biceps', display_name: 'Bíceps', category: 'upper' },
    { name: 'triceps', display_name: 'Tríceps', category: 'upper' },
    { name: 'forearms', display_name: 'Antebrazos', category: 'upper' },
    { name: 'abs', display_name: 'Abdominales', category: 'core' },
    { name: 'obliques', display_name: 'Oblicuos', category: 'core' },
    { name: 'lower_back', display_name: 'Lumbar', category: 'core' },
    { name: 'quads', display_name: 'Cuádriceps', category: 'lower' },
    { name: 'hamstrings', display_name: 'Femorales', category: 'lower' },
    { name: 'glutes', display_name: 'Glúteos', category: 'lower' },
    { name: 'calves', display_name: 'Gemelos', category: 'lower' },
  ];
  
  for (const muscle of muscles) {
    const docRef = db.collection('muscles').doc(muscle.name);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      await docRef.set({ id: muscle.name, ...muscle });
      console.log(`Created muscle: ${muscle.name}`);
    }
  }
}

// Seed exercises
async function seedExercises() {
  const exercises = [
    // Chest
    { name: 'Press Banca', prime_muscle: 'chest', secondary_muscles: ['triceps', 'shoulders'], equipment: ['barra'], difficulty: 'intermediate', is_compound: true },
    { name: 'Press Banca Inclinado', prime_muscle: 'chest', secondary_muscles: ['shoulders', 'triceps'], equipment: ['barra'], difficulty: 'intermediate', is_compound: true },
    { name: 'Aperturas con Mancuernas', prime_muscle: 'chest', secondary_muscles: ['shoulders'], equipment: ['mancuernas'], difficulty: 'beginner', is_compound: false },
    { name: 'Fondos en Paralelas', prime_muscle: 'chest', secondary_muscles: ['triceps', 'shoulders'], equipment: ['peso_corporal'], difficulty: 'intermediate', is_compound: true },
    
    // Back
    { name: 'Peso Muerto', prime_muscle: 'back', secondary_muscles: ['hamstrings', 'glutes', 'lower_back'], equipment: ['barra'], difficulty: 'advanced', is_compound: true },
    { name: 'Dominadas', prime_muscle: 'back', secondary_muscles: ['biceps'], equipment: ['peso_corporal'], difficulty: 'intermediate', is_compound: true },
    { name: 'Remo con Barra', prime_muscle: 'back', secondary_muscles: ['biceps'], equipment: ['barra'], difficulty: 'intermediate', is_compound: true },
    { name: 'Jalón al Pecho', prime_muscle: 'back', secondary_muscles: ['biceps'], equipment: ['maquina'], difficulty: 'beginner', is_compound: true },
    
    // Shoulders
    { name: 'Press Militar', prime_muscle: 'shoulders', secondary_muscles: ['triceps'], equipment: ['barra'], difficulty: 'intermediate', is_compound: true },
    { name: 'Elevaciones Laterales', prime_muscle: 'shoulders', secondary_muscles: [], equipment: ['mancuernas'], difficulty: 'beginner', is_compound: false },
    { name: 'Press con Mancuernas', prime_muscle: 'shoulders', secondary_muscles: ['triceps'], equipment: ['mancuernas'], difficulty: 'beginner', is_compound: true },
    
    // Arms
    { name: 'Curl con Barra', prime_muscle: 'biceps', secondary_muscles: [], equipment: ['barra'], difficulty: 'beginner', is_compound: false },
    { name: 'Curl Martillo', prime_muscle: 'biceps', secondary_muscles: ['forearms'], equipment: ['mancuernas'], difficulty: 'beginner', is_compound: false },
    { name: 'Extensiones de Tríceps', prime_muscle: 'triceps', secondary_muscles: [], equipment: ['mancuernas'], difficulty: 'beginner', is_compound: false },
    { name: 'Press Francés', prime_muscle: 'triceps', secondary_muscles: [], equipment: ['barra'], difficulty: 'intermediate', is_compound: false },
    
    // Legs
    { name: 'Sentadilla', prime_muscle: 'quads', secondary_muscles: ['glutes', 'hamstrings'], equipment: ['barra'], difficulty: 'intermediate', is_compound: true },
    { name: 'Sentadilla Búlgara', prime_muscle: 'quads', secondary_muscles: ['glutes'], equipment: ['mancuernas'], difficulty: 'intermediate', is_compound: true },
    { name: 'Peso Muerto Rumano', prime_muscle: 'hamstrings', secondary_muscles: ['glutes', 'lower_back'], equipment: ['barra'], difficulty: 'intermediate', is_compound: true },
    { name: 'Curl Femoral', prime_muscle: 'hamstrings', secondary_muscles: [], equipment: ['maquina'], difficulty: 'beginner', is_compound: false },
    { name: 'Extensión de Cuádriceps', prime_muscle: 'quads', secondary_muscles: [], equipment: ['maquina'], difficulty: 'beginner', is_compound: false },
    { name: 'Hip Thrust', prime_muscle: 'glutes', secondary_muscles: ['hamstrings'], equipment: ['barra'], difficulty: 'intermediate', is_compound: true },
    { name: 'Elevación de Gemelos', prime_muscle: 'calves', secondary_muscles: [], equipment: ['maquina'], difficulty: 'beginner', is_compound: false },
    
    // Core
    { name: 'Planchas', prime_muscle: 'abs', secondary_muscles: ['obliques'], equipment: ['peso_corporal'], difficulty: 'beginner', is_compound: false },
    { name: 'Crunches', prime_muscle: 'abs', secondary_muscles: [], equipment: ['peso_corporal'], difficulty: 'beginner', is_compound: false },
    { name: 'Elevación de Piernas', prime_muscle: 'abs', secondary_muscles: [], equipment: ['peso_corporal'], difficulty: 'intermediate', is_compound: false },
  ];
  
  for (const exercise of exercises) {
    // Check if exercise already exists
    const snapshot = await db.collection('exercises').where('name', '==', exercise.name).limit(1).get();
    
    if (snapshot.empty) {
      await db.collection('exercises').add({
        ...exercise,
        video_url: '',
        description: '',
        instructions: '',
        created_by: null,
      });
      console.log(`Created exercise: ${exercise.name}`);
    }
  }
}

// Seed templates
async function seedTemplates(adminId: string) {
  const templates = [
    {
      name: 'PPL 6 Semanas',
      description: 'Rutina Push-Pull-Legs de 6 semanas, 6 días por semana',
      split: 'PPL',
      weeks: 6,
      days_per_week: 6,
      days: [
        {
          day_number: 1,
          name: 'Push (Empuje)',
          exercises: [
            { exercise_name: 'Press Banca', sets: 4, rep_range_min: 6, rep_range_max: 8, rir_target: 2, rest_seconds: 180 },
            { exercise_name: 'Press Banca Inclinado', sets: 3, rep_range_min: 8, rep_range_max: 10, rir_target: 2, rest_seconds: 150 },
            { exercise_name: 'Press Militar', sets: 4, rep_range_min: 6, rep_range_max: 8, rir_target: 2, rest_seconds: 180 },
            { exercise_name: 'Elevaciones Laterales', sets: 3, rep_range_min: 12, rep_range_max: 15, rir_target: 2, rest_seconds: 90 },
            { exercise_name: 'Extensiones de Tríceps', sets: 3, rep_range_min: 10, rep_range_max: 12, rir_target: 2, rest_seconds: 90 },
          ],
        },
        {
          day_number: 2,
          name: 'Pull (Tirón)',
          exercises: [
            { exercise_name: 'Peso Muerto', sets: 4, rep_range_min: 5, rep_range_max: 6, rir_target: 2, rest_seconds: 240 },
            { exercise_name: 'Dominadas', sets: 4, rep_range_min: 6, rep_range_max: 10, rir_target: 2, rest_seconds: 180 },
            { exercise_name: 'Remo con Barra', sets: 4, rep_range_min: 8, rep_range_max: 10, rir_target: 2, rest_seconds: 150 },
            { exercise_name: 'Curl con Barra', sets: 3, rep_range_min: 8, rep_range_max: 12, rir_target: 2, rest_seconds: 90 },
            { exercise_name: 'Curl Martillo', sets: 3, rep_range_min: 10, rep_range_max: 12, rir_target: 2, rest_seconds: 90 },
          ],
        },
        {
          day_number: 3,
          name: 'Legs (Piernas)',
          exercises: [
            { exercise_name: 'Sentadilla', sets: 4, rep_range_min: 6, rep_range_max: 8, rir_target: 2, rest_seconds: 240 },
            { exercise_name: 'Peso Muerto Rumano', sets: 3, rep_range_min: 8, rep_range_max: 10, rir_target: 2, rest_seconds: 180 },
            { exercise_name: 'Sentadilla Búlgara', sets: 3, rep_range_min: 10, rep_range_max: 12, rir_target: 2, rest_seconds: 120 },
            { exercise_name: 'Curl Femoral', sets: 3, rep_range_min: 10, rep_range_max: 12, rir_target: 2, rest_seconds: 90 },
            { exercise_name: 'Elevación de Gemelos', sets: 4, rep_range_min: 12, rep_range_max: 15, rir_target: 2, rest_seconds: 60 },
          ],
        },
      ],
    },
    {
      name: 'Upper-Lower 8 Semanas',
      description: 'Rutina Upper-Lower de 8 semanas, 4 días por semana',
      split: 'UL',
      weeks: 8,
      days_per_week: 4,
      days: [
        {
          day_number: 1,
          name: 'Upper A (Tren Superior A)',
          exercises: [
            { exercise_name: 'Press Banca', sets: 4, rep_range_min: 6, rep_range_max: 8, rir_target: 2, rest_seconds: 180 },
            { exercise_name: 'Remo con Barra', sets: 4, rep_range_min: 8, rep_range_max: 10, rir_target: 2, rest_seconds: 150 },
            { exercise_name: 'Press Militar', sets: 3, rep_range_min: 8, rep_range_max: 10, rir_target: 2, rest_seconds: 150 },
            { exercise_name: 'Jalón al Pecho', sets: 3, rep_range_min: 10, rep_range_max: 12, rir_target: 2, rest_seconds: 120 },
            { exercise_name: 'Curl con Barra', sets: 3, rep_range_min: 10, rep_range_max: 12, rir_target: 2, rest_seconds: 90 },
          ],
        },
        {
          day_number: 2,
          name: 'Lower A (Tren Inferior A)',
          exercises: [
            { exercise_name: 'Sentadilla', sets: 4, rep_range_min: 6, rep_range_max: 8, rir_target: 2, rest_seconds: 240 },
            { exercise_name: 'Peso Muerto Rumano', sets: 3, rep_range_min: 8, rep_range_max: 10, rir_target: 2, rest_seconds: 180 },
            { exercise_name: 'Extensión de Cuádriceps', sets: 3, rep_range_min: 10, rep_range_max: 12, rir_target: 2, rest_seconds: 90 },
            { exercise_name: 'Curl Femoral', sets: 3, rep_range_min: 10, rep_range_max: 12, rir_target: 2, rest_seconds: 90 },
            { exercise_name: 'Elevación de Gemelos', sets: 4, rep_range_min: 12, rep_range_max: 15, rir_target: 2, rest_seconds: 60 },
          ],
        },
      ],
    },
    {
      name: 'Full Body 4 Semanas',
      description: 'Rutina Full Body de 4 semanas, 3 días por semana',
      split: 'FULL',
      weeks: 4,
      days_per_week: 3,
      days: [
        {
          day_number: 1,
          name: 'Full Body A',
          exercises: [
            { exercise_name: 'Sentadilla', sets: 3, rep_range_min: 8, rep_range_max: 10, rir_target: 2, rest_seconds: 180 },
            { exercise_name: 'Press Banca', sets: 3, rep_range_min: 8, rep_range_max: 10, rir_target: 2, rest_seconds: 150 },
            { exercise_name: 'Remo con Barra', sets: 3, rep_range_min: 8, rep_range_max: 10, rir_target: 2, rest_seconds: 150 },
            { exercise_name: 'Press Militar', sets: 2, rep_range_min: 10, rep_range_max: 12, rir_target: 2, rest_seconds: 120 },
            { exercise_name: 'Planchas', sets: 3, rep_range_min: 30, rep_range_max: 60, rir_target: 2, rest_seconds: 60 },
          ],
        },
      ],
    },
  ];
  
  for (const template of templates) {
    // Check if template already exists
    const snapshot = await db.collection('templates').where('name', '==', template.name).limit(1).get();
    
    if (snapshot.empty) {
      await db.collection('templates').add({
        ...template,
        created_by: adminId,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Created template: ${template.name}`);
    }
  }
}

// Seed admin settings
async function seedAdminSettings() {
  const settingsRef = db.collection('admin_settings').doc('global');
  const doc = await settingsRef.get();
  
  if (!doc.exists) {
    await settingsRef.set({
      id: 'global',
      feature_flags: {
        allow_signup: true,
        coach_can_create_exercises: true,
      },
      units_default: 'kg',
      write_limits: {
        sets_per_minute: 120,
      },
    });
    console.log('Created admin settings');
  }
}

// Main seed function
export const seedCatalogs = functions.https.onCall(async (data, context) => {
  const adminId = await requireAdmin(context);
  
  try {
    console.log('Starting seed process...');
    
    await seedMuscles();
    await seedExercises();
    await seedTemplates(adminId);
    await seedAdminSettings();
    
    await createAuditLog(adminId, 'EXECUTE_SEED', 'catalogs', {
      metadata: { timestamp: new Date().toISOString() },
    });
    
    console.log('Seed process completed successfully');
    
    return { success: true, message: 'Seed completado exitosamente' };
  } catch (error: any) {
    console.error('Error in seed process:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
