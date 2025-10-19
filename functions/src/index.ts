/**
 * Firebase Cloud Functions
 * 
 * Estas funciones se ejecutan en el backend y pueden ser llamadas desde el cliente.
 * 
 * Para desplegar:
 * 1. npm install -g firebase-tools
 * 2. firebase login
 * 3. firebase init functions (selecciona tu proyecto)
 * 4. firebase deploy --only functions
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Import admin functions
export {
  createUserWithRole,
  sendInvitation,
  setUserRole,
  disableUser,
  deleteUser,
  resetUserPassword,
  revokeInvitation,
  assignCoach,
} from './admin';

// Import seed functions
export { seedCatalogs } from './seed';

// Import backup functions
export { backupCollections, reindexComputedFields } from './backup';

// Import AI callable functions
export { aiSuggestWorkoutTweaks, aiGenerateProgram, aiSummarizeCheckIn } from './ai';

/**
 * Función: Ajuste Automático de Volumen Semanal
 * 
 * Se ejecuta cada domingo a las 23:00 para analizar la semana y ajustar
 * los targets de la siguiente semana basándose en:
 * - Fatiga acumulada (pump + soreness)
 * - Cumplimiento de targets (actual vs objetivo)
 * - RIR promedio (si está muy lejos del target, ajustar)
 */
export const adjustWeeklyVolume = functions.pubsub
  .schedule('0 23 * * 0') // Cada domingo a las 23:00
  .timeZone('America/Mexico_City')
  .onRun(async (context: any) => {
    const db = admin.firestore();
    
    // Obtener todos los mesociclos activos
    const activeMesocycles = await db
      .collection('mesocycles')
      .where('status', '==', 'active')
      .get();

    for (const mesoDoc of activeMesocycles.docs) {
      const meso = mesoDoc.data();
      const startDate = meso.start_date.toDate();
      const currentWeek = Math.ceil((Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

      // Obtener workouts de la semana actual
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      
      const workouts = await db
        .collection('workouts')
        .where('mesocycle_id', '==', mesoDoc.id)
        .where('completed_at', '>=', weekStart)
        .where('status', '==', 'completed')
        .get();

  const workoutIds = workouts.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.id);
      
      if (workoutIds.length === 0) continue;

      // Analizar fatiga y volumen por músculo
      const muscleStats: Record<string, { 
        sets: number; 
        avgPump: number; 
        avgSoreness: number; 
        avgRIR: number;
        count: number;
      }> = {};

      for (const workoutId of workoutIds) {
        const sets = await db
          .collection('sets')
          .where('workout_id', '==', workoutId)
          .get();

        for (const setDoc of sets.docs) {
          const set = setDoc.data();
          
          // Obtener músculo del ejercicio
          const exerciseDoc = await db.collection('exercises').doc(set.exercise_id).get();
          if (!exerciseDoc.exists) continue;
          
          const muscleId = exerciseDoc.data()!.prime_muscle;
          
          if (!muscleStats[muscleId]) {
            muscleStats[muscleId] = { sets: 0, avgPump: 0, avgSoreness: 0, avgRIR: 0, count: 0 };
          }
          
          muscleStats[muscleId].sets += 1;
          muscleStats[muscleId].avgPump += set.perceived_pump || 0;
          muscleStats[muscleId].avgSoreness += set.perceived_soreness || 0;
          muscleStats[muscleId].avgRIR += set.rir_actual || 0;
          muscleStats[muscleId].count += 1;
        }
      }

      // Calcular promedios
      Object.keys(muscleStats).forEach(muscleId => {
        const stats = muscleStats[muscleId];
        if (stats.count > 0) {
          stats.avgPump /= stats.count;
          stats.avgSoreness /= stats.count;
          stats.avgRIR /= stats.count;
        }
      });

      // Ajustar targets de la siguiente semana
      const nextWeek = currentWeek + 1;
      
      for (const muscleId of Object.keys(muscleStats)) {
        const stats = muscleStats[muscleId];
        
        // Obtener target actual
        const targetQuery = await db
          .collection('weekly_targets')
          .where('mesocycle_id', '==', mesoDoc.id)
          .where('muscle_id', '==', muscleId)
          .where('week_number', '==', nextWeek)
          .get();

        if (targetQuery.empty) continue;

        const targetDoc = targetQuery.docs[0];
        const currentTarget = targetDoc.data();
        
        let adjustment = 0;
        
        // Lógica de ajuste:
        // 1. Si fatiga alta (pump > 8 o soreness > 8): reducir 10%
        if (stats.avgPump > 8 || stats.avgSoreness > 8) {
          adjustment = -0.1;
        }
        // 2. Si fatiga baja (pump < 5 y soreness < 5) y RIR > 3: aumentar 5%
        else if (stats.avgPump < 5 && stats.avgSoreness < 5 && stats.avgRIR > 3) {
          adjustment = 0.05;
        }
        // 3. Si no cumplió target (actual < min): mantener o reducir
        else if (stats.sets < currentTarget.sets_min) {
          adjustment = -0.05;
        }

        // Aplicar ajuste
        if (adjustment !== 0) {
          const newTarget = Math.round(currentTarget.sets_target * (1 + adjustment));
          const newMin = Math.floor(newTarget * 0.9);
          const newMax = Math.ceil(newTarget * 1.1);

          await targetDoc.ref.update({
            sets_target: newTarget,
            sets_min: newMin,
            sets_max: newMax,
          });

          functions.logger.info(`Adjusted ${muscleId} for user ${meso.user_id}: ${currentTarget.sets_target} → ${newTarget}`);
        }
      }
    }

    return null;
  });

/**
 * Función: Notificación de Entrenamiento Pendiente
 * 
 * Se ejecuta cada día a las 8:00 AM para recordar entrenamientos del día
 */
export const notifyPendingWorkouts = functions.pubsub
  .schedule('0 8 * * *')
  .timeZone('America/Mexico_City')
  .onRun(async (context: functions.EventContext) => {
    const db = admin.firestore();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const workouts = await db
      .collection('workouts')
      .where('planned_date', '>=', today)
      .where('planned_date', '<', tomorrow)
      .where('status', '==', 'pending')
      .get();

    functions.logger.info(`Found ${workouts.size} pending workouts for today`);

    // Aquí se podría integrar con servicios de notificación push
    // Por ahora solo registramos en logs
    
    return null;
  });

/**
 * Función HTTP: Calcular e1RM de un usuario
 * 
 * Ejemplo de uso:
 * curl -X POST https://[region]-[project].cloudfunctions.net/calculateUserE1RM \
 *   -H "Content-Type: application/json" \
 *   -d '{"userId": "abc123", "exerciseId": "bench-press"}'
 */
export const calculateUserE1RM = functions.https.onCall(async (
  data: { exerciseId: string },
  context: functions.https.CallableContext
) => {
  const { exerciseId } = data;

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const db = admin.firestore();
  
  const sets = await db
    .collection('sets')
    .where('exercise_id', '==', exerciseId)
    .orderBy('created_at', 'desc')
    .limit(10)
    .get();

  if (sets.empty) {
    return { e1rm: 0, count: 0 };
  }

  const e1rms = sets.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const set = doc.data();
    // Fórmula de Epley con RIR
    const repsToFailure = set.completed_reps + (set.rir_actual || 0);
    return set.load * (1 + repsToFailure / 30);
  });

  const maxE1RM = Math.max(...e1rms);
  
  return {
    e1rm: Math.round(maxE1RM),
    count: e1rms.length,
    recent: e1rms,
  };
});
