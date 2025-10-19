"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateUserE1RM = exports.notifyPendingWorkouts = exports.adjustWeeklyVolume = exports.aiSummarizeCheckIn = exports.aiGenerateProgram = exports.aiSuggestWorkoutTweaks = exports.reindexComputedFields = exports.backupCollections = exports.seedCatalogs = exports.updateUserRole = exports.assignCoach = exports.revokeInvitation = exports.resetUserPassword = exports.deleteUser = exports.disableUser = exports.setUserRole = exports.sendInvitation = exports.createUserWithRole = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// Import admin functions
var admin_1 = require("./admin");
Object.defineProperty(exports, "createUserWithRole", { enumerable: true, get: function () { return admin_1.createUserWithRole; } });
Object.defineProperty(exports, "sendInvitation", { enumerable: true, get: function () { return admin_1.sendInvitation; } });
Object.defineProperty(exports, "setUserRole", { enumerable: true, get: function () { return admin_1.setUserRole; } });
Object.defineProperty(exports, "disableUser", { enumerable: true, get: function () { return admin_1.disableUser; } });
Object.defineProperty(exports, "deleteUser", { enumerable: true, get: function () { return admin_1.deleteUser; } });
Object.defineProperty(exports, "resetUserPassword", { enumerable: true, get: function () { return admin_1.resetUserPassword; } });
Object.defineProperty(exports, "revokeInvitation", { enumerable: true, get: function () { return admin_1.revokeInvitation; } });
Object.defineProperty(exports, "assignCoach", { enumerable: true, get: function () { return admin_1.assignCoach; } });
Object.defineProperty(exports, "updateUserRole", { enumerable: true, get: function () { return admin_1.updateUserRole; } });
// Import seed functions
var seed_1 = require("./seed");
Object.defineProperty(exports, "seedCatalogs", { enumerable: true, get: function () { return seed_1.seedCatalogs; } });
// Import backup functions
var backup_1 = require("./backup");
Object.defineProperty(exports, "backupCollections", { enumerable: true, get: function () { return backup_1.backupCollections; } });
Object.defineProperty(exports, "reindexComputedFields", { enumerable: true, get: function () { return backup_1.reindexComputedFields; } });
// Import AI callable functions
var ai_1 = require("./ai");
Object.defineProperty(exports, "aiSuggestWorkoutTweaks", { enumerable: true, get: function () { return ai_1.aiSuggestWorkoutTweaks; } });
Object.defineProperty(exports, "aiGenerateProgram", { enumerable: true, get: function () { return ai_1.aiGenerateProgram; } });
Object.defineProperty(exports, "aiSummarizeCheckIn", { enumerable: true, get: function () { return ai_1.aiSummarizeCheckIn; } });
/**
 * Función: Ajuste Automático de Volumen Semanal
 *
 * Se ejecuta cada domingo a las 23:00 para analizar la semana y ajustar
 * los targets de la siguiente semana basándose en:
 * - Fatiga acumulada (pump + soreness)
 * - Cumplimiento de targets (actual vs objetivo)
 * - RIR promedio (si está muy lejos del target, ajustar)
 */
exports.adjustWeeklyVolume = functions.pubsub
    .schedule('0 23 * * 0') // Cada domingo a las 23:00
    .timeZone('America/Mexico_City')
    .onRun(async (context) => {
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
        const workoutIds = workouts.docs.map((d) => d.id);
        if (workoutIds.length === 0)
            continue;
        // Analizar fatiga y volumen por músculo
        const muscleStats = {};
        for (const workoutId of workoutIds) {
            const sets = await db
                .collection('sets')
                .where('workout_id', '==', workoutId)
                .get();
            for (const setDoc of sets.docs) {
                const set = setDoc.data();
                // Obtener músculo del ejercicio
                const exerciseDoc = await db.collection('exercises').doc(set.exercise_id).get();
                if (!exerciseDoc.exists)
                    continue;
                const muscleId = exerciseDoc.data().prime_muscle;
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
            if (targetQuery.empty)
                continue;
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
exports.notifyPendingWorkouts = functions.pubsub
    .schedule('0 8 * * *')
    .timeZone('America/Mexico_City')
    .onRun(async (context) => {
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
exports.calculateUserE1RM = functions.https.onCall(async (data, context) => {
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
    const e1rms = sets.docs.map((doc) => {
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
//# sourceMappingURL=index.js.map