/**
 * Algoritmos de progresión y autorregulación
 * Incluye memoización para cálculos intensivos
 */

// Cache para cálculos de 1RM
const e1rmCache = new Map<string, number>();

export interface SetHistory {
  load: number;
  completed_reps: number;
  rir_actual: number;
  rpe: number;
  perceived_pump?: number;
  perceived_soreness?: number;
  created_at: Date;
}

export interface LoadSuggestion {
  load: number;
  reps: number;
  reason: string;
  explanation?: string;
  reason_explained?: string; // NEW: Detailed explanation for UI tooltip
  alternative?: {
    load: number;
    reps: number;
    reason: string;
  } | null;
}

/**
 * Calcula la carga sugerida para la próxima serie basándose en el historial
 * 
 * Lógica:
 * - Si RIR promedio ≤ 0.5 y completó reps target: +5% carga
 * - Si RIR promedio ≤ 1.5: mantener carga, +1 rep
 * - Si RIR promedio ≥ 3: -10% carga
 * - Caso contrario: mantener
 */
export function calculateNextLoad(history: SetHistory[], targetReps: number = 10): LoadSuggestion {
  if (history.length === 0) {
    return { 
      load: 0, 
      reps: targetReps, 
      reason: 'Sin historial',
      explanation: 'No hay datos previos. Comienza con un peso que te permita completar las repeticiones con 2-3 RIR.',
      alternative: null
    };
  }
  
  const recentSets = history.slice(-3);
  const avgRir = recentSets.reduce((sum, s) => sum + s.rir_actual, 0) / recentSets.length;
  const lastSet = recentSets[recentSets.length - 1];
  const lastLoad = lastSet.load;
  const lastReps = lastSet.completed_reps;
  
  // Muy cerca del fallo y completó reps -> aumentar carga
  if (avgRir <= 0.5 && lastReps >= targetReps) {
    return {
      load: Math.round(lastLoad * 1.05),
      reps: targetReps,
      reason: '+5% carga',
      explanation: `Tu RIR promedio fue ${avgRir.toFixed(1)} y completaste ${lastReps} reps. Estás listo para más peso.`,
      reason_explained: `📈 **Por qué aumentar peso:**\n\n` +
        `Tu RIR promedio de ${avgRir.toFixed(1)} indica que estás llegando muy cerca del fallo muscular (0 = fallo). ` +
        `Además, completaste ${lastReps} de ${targetReps} reps objetivo.\n\n` +
        `**Principio científico:** Cuando trabajas consistentemente con RIR ≤ 1 y completas las reps, ` +
        `has demostrado adaptación neuromuscular. Un incremento de 5% (~${Math.round(lastLoad * 0.05)}kg) ` +
        `mantiene la carga en el rango de hipertrofia (6-30 reps) según Schoenfeld (2023).\n\n` +
        `**Alternativa:** Si prefieres progresión vertical (más reps), puedes mantener ${lastLoad}kg y hacer ${targetReps + 1} reps.`,
      alternative: {
        load: lastLoad,
        reps: Math.min(targetReps + 1, 15),
        reason: 'Mantener carga, +1 rep'
      }
    };
  }
  
  // Cerca del fallo -> aumentar reps
  if (avgRir <= 1.5) {
    return {
      load: lastLoad,
      reps: Math.min(targetReps + 1, 15),
      reason: 'Aumentar repeticiones',
      explanation: `Tu RIR promedio fue ${avgRir.toFixed(1)}. Mantén el peso y aumenta reps para acumular más volumen.`,
      reason_explained: `📊 **Por qué aumentar repeticiones:**\n\n` +
        `Tu RIR de ${avgRir.toFixed(1)} indica que estás trabajando cerca del fallo (óptimo para hipertrofia). ` +
        `Sin embargo, aún no has alcanzado la máxima capacidad en este peso.\n\n` +
        `**Principio científico:** La progresión vertical (más reps con mismo peso) acumula volumen ` +
        `sin aumentar carga absoluta, reduciendo fatiga sistémica. Según Helms (2023), esto es ideal ` +
        `cuando RIR está en 1-2 (muy cerca del fallo pero no sobreentrenando).\n\n` +
        `**Alternativa:** Si prefieres progresión horizontal, puedes aumentar ${Math.round(lastLoad * 0.025)}kg (+2.5%) ` +
        `y mantener ${targetReps} reps.`,
      alternative: {
        load: Math.round(lastLoad * 1.025),
        reps: targetReps,
        reason: 'Aumentar carga ligeramente (+2.5%)'
      }
    };
  }
  
  // Lejos del fallo -> reducir carga
  if (avgRir >= 3) {
    return {
      load: Math.round(lastLoad * 0.90),
      reps: targetReps,
      reason: 'Reducir carga: RIR alto',
      explanation: `Tu RIR promedio fue ${avgRir.toFixed(1)}, demasiado alto. Reduce peso para trabajar más cerca del fallo.`,
      reason_explained: `⚠️ **Por qué reducir peso:**\n\n` +
        `Tu RIR de ${avgRir.toFixed(1)} indica que estás dejando ${avgRir.toFixed(0)}+ reps en reserva. ` +
        `Esto significa que NO estás estimulando suficiente adaptación muscular.\n\n` +
        `**Principio científico:** Para hipertrofia, la evidencia (Schoenfeld 2023, Hackett 2024) muestra que ` +
        `sets con RIR 0-3 generan mayor crecimiento muscular. RIR > 3 es "junk volume" (volumen basura).\n\n` +
        `**Acción recomendada:** Reduce ${Math.round(lastLoad * 0.10)}kg (-10%) y trabaja con RIR 1-2. ` +
        `Esto maximiza estímulo sin fatiga excesiva.\n\n` +
        `**Alternativa:** Reduce solo -5% si crees que fue un día malo (fatiga, sueño insuficiente).`,
      alternative: {
        load: Math.round(lastLoad * 0.95),
        reps: targetReps + 2,
        reason: 'Reducción menor (-5%) con más reps'
      }
    };
  }
  
  return {
    load: lastLoad,
    reps: targetReps,
    reason: 'Mantener',
    explanation: `Tu RIR promedio fue ${avgRir.toFixed(1)}, en rango óptimo. Continúa con esta carga.`,
    reason_explained: `✅ **Por qué mantener:**\n\n` +
      `Tu RIR de ${avgRir.toFixed(1)} está en el rango óptimo (1.5-3.0) para hipertrofia. ` +
      `Estás trabajando con suficiente intensidad sin generar fatiga excesiva.\n\n` +
      `**Principio científico:** Según Israetel (RP Hypertrophy), mantener RIR consistente en 1-3 ` +
      `permite acumular volumen semanal sin necesidad de deload prematuro.\n\n` +
      `**Acción recomendada:** Mantén ${lastLoad}kg × ${targetReps} reps. ` +
      `Si en 2-3 sesiones tu RIR baja a ≤1, entonces aumenta peso.`,
    alternative: null
  };
}

/**
 * Calcula el 1RM estimado usando la fórmula de Epley
 * e1RM = peso × (1 + reps / 30)
 * Incluye cache para evitar recálculos
 */
export function calculateE1RM(load: number, reps: number): number {
  const cacheKey = `${load}-${reps}`;
  
  if (e1rmCache.has(cacheKey)) {
    return e1rmCache.get(cacheKey)!;
  }
  
  const e1rm = Math.round(load * (1 + reps / 30));
  e1rmCache.set(cacheKey, e1rm);
  
  // Limpiar cache si crece mucho (>1000 entradas)
  if (e1rmCache.size > 1000) {
    const keysToDelete = Array.from(e1rmCache.keys()).slice(0, 500);
    keysToDelete.forEach(key => e1rmCache.delete(key));
  }
  
  return e1rm;
}

/**
 * Calcula el 1RM estimado ajustado por RIR
 * Con memoización automática
 */
export function calculateE1RMWithRIR(load: number, reps: number, rir: number): number {
  const totalReps = reps + rir;
  return calculateE1RM(load, totalReps);
}

/**
 * Determina si hay estancamiento en un ejercicio
 * Estancamiento = 3+ sesiones sin mejora en e1RM
 */
export function detectPlateau(history: SetHistory[], threshold: number = 3): {
  isPlateaued: boolean;
  sessionsWithoutImprovement: number;
} {
  if (history.length < threshold) {
    return { isPlateaued: false, sessionsWithoutImprovement: 0 };
  }
  
  const e1rms = history.map(s => calculateE1RMWithRIR(s.load, s.completed_reps, s.rir_actual));
  
  let noImprovementCount = 0;
  for (let i = e1rms.length - 1; i > 0; i--) {
    if (e1rms[i] <= e1rms[i - 1]) {
      noImprovementCount++;
    } else {
      break;
    }
  }
  
  return {
    isPlateaued: noImprovementCount >= threshold,
    sessionsWithoutImprovement: noImprovementCount,
  };
}

/**
 * Calcula el ajuste de volumen semanal basado en feedback subjetivo
 * 
 * Reglas:
 * - Soreness promedio ≥ 6 → Reducir 20%
 * - Pump promedio ≤ 3 Y soreness promedio ≤ 3 → Añadir 1 set
 * - Caso contrario: mantener
 */
export function calculateVolumeAdjustment(
  pumpScores: number[],
  sorenessScores: number[]
): {
  adjustment: number;
  reason: string;
} {
  if (pumpScores.length === 0 || sorenessScores.length === 0) {
    return { adjustment: 0, reason: 'Sin datos suficientes' };
  }
  
  const avgPump = pumpScores.reduce((sum, s) => sum + s, 0) / pumpScores.length;
  const avgSoreness = sorenessScores.reduce((sum, s) => sum + s, 0) / sorenessScores.length;
  
  // Fatiga excesiva
  if (avgSoreness >= 6) {
    return {
      adjustment: -0.2,
      reason: 'Reducir volumen: fatiga excesiva',
    };
  }
  
  // Respuesta baja
  if (avgPump <= 3 && avgSoreness <= 3) {
    return {
      adjustment: 1,
      reason: 'Añadir 1 set: respuesta baja',
    };
  }
  
  return {
    adjustment: 0,
    reason: 'Mantener volumen',
  };
}

/**
 * Calcula el RIR target óptimo basado en el tipo de ejercicio
 */
export function calculateOptimalRIR(
  exerciseType: 'compound' | 'isolation',
  weekNumber: number,
  totalWeeks: number
): number {
  const isDeloadWeek = weekNumber === totalWeeks;
  
  if (isDeloadWeek) return 4;
  
  // Ejercicios compuestos: RIR más conservador
  if (exerciseType === 'compound') {
    return weekNumber <= 2 ? 3 : weekNumber <= 4 ? 2 : 1;
  }
  
  // Ejercicios de aislamiento: RIR más agresivo
  return weekNumber <= 2 ? 2 : weekNumber <= 4 ? 1 : 0;
}
