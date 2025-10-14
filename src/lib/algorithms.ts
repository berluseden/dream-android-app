/**
 * Algoritmos de progresión y autorregulación
 */

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
    alternative: null
  };
}

/**
 * Calcula el 1RM estimado usando la fórmula de Epley
 * e1RM = peso × (1 + reps / 30)
 */
export function calculateE1RM(load: number, reps: number): number {
  return Math.round(load * (1 + reps / 30));
}

/**
 * Calcula el 1RM estimado ajustado por RIR
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
