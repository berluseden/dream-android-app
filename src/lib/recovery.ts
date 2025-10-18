/**
 * Recovery Score System
 * Based on:
 * - Hackett et al. (2024): Integration of Sleep and HRV into Strength Adaptation Models
 * - Helms et al. (2023): Auto-regulation and Fatigue Management
 * 
 * Score: 0-100
 * - 80-100: Good recovery (green)
 * - 60-79: Moderate recovery (yellow)
 * - 0-59: Poor recovery (red) → reduce volume 20%
 */

export interface RecoveryInputs {
  sleepHours: number;        // Daily sleep (0-12)
  avgHRV: number;            // Heart Rate Variability in ms (20-150)
  restingHR: number;         // Resting heart rate in bpm (40-100)
  avgSoreness: number;       // Muscle soreness (1-10)
  adherence: number;         // % sessions completed (0-100)
}

export interface RecoveryScore {
  score: number;             // 0-100
  category: 'good' | 'moderate' | 'poor';
  breakdown: {
    sleep: number;
    hrv: number;
    restingHR: number;
    soreness: number;
    adherence: number;
  };
  recommendations: string[];
}

/**
 * Calculate comprehensive recovery score
 * 
 * Scoring system:
 * - Base score: 100
 * - Sleep < 6h: -25 pts
 * - Sleep 6-7h: -10 pts
 * - HRV < 50ms: -20 pts
 * - HRV 50-70ms: -10 pts
 * - Resting HR > 75 bpm: -15 pts
 * - Resting HR 65-75 bpm: -5 pts
 * - Soreness ≥ 6: -20 pts
 * - Soreness 4-5: -10 pts
 * - Adherence < 80%: -10 pts
 * - Adherence 80-90%: -5 pts
 */
export function calculateRecoveryScore(inputs: RecoveryInputs): RecoveryScore {
  let score = 100;
  const breakdown = {
    sleep: 0,
    hrv: 0,
    restingHR: 0,
    soreness: 0,
    adherence: 0,
  };
  const recommendations: string[] = [];

  // Sleep scoring (optimal: 7-9h)
  if (inputs.sleepHours < 6) {
    breakdown.sleep = -25;
    score -= 25;
    recommendations.push('Aumenta tus horas de sueño a 7-9h para optimizar recuperación');
  } else if (inputs.sleepHours < 7) {
    breakdown.sleep = -10;
    score -= 10;
    recommendations.push('Intenta dormir al menos 7 horas para mejor recuperación');
  } else if (inputs.sleepHours >= 7 && inputs.sleepHours <= 9) {
    breakdown.sleep = 0;
  } else if (inputs.sleepHours > 9) {
    breakdown.sleep = -5;
    score -= 5;
    recommendations.push('Dormir más de 9h puede indicar sobreentrenamiento o mala calidad de sueño');
  }

  // HRV scoring (optimal: 70-150ms for trained individuals)
  if (inputs.avgHRV < 50) {
    breakdown.hrv = -20;
    score -= 20;
    recommendations.push('HRV bajo indica fatiga sistémica. Considera reducir volumen o deload.');
  } else if (inputs.avgHRV < 70) {
    breakdown.hrv = -10;
    score -= 10;
    recommendations.push('HRV subóptimo. Prioriza sueño y manejo de estrés.');
  } else {
    breakdown.hrv = 0;
  }

  // Resting HR scoring (optimal: 50-65 bpm for trained individuals)
  if (inputs.restingHR > 75) {
    breakdown.restingHR = -15;
    score -= 15;
    recommendations.push('FC en reposo elevada. Posible sobreentrenamiento o estrés.');
  } else if (inputs.restingHR > 65) {
    breakdown.restingHR = -5;
    score -= 5;
  } else {
    breakdown.restingHR = 0;
  }

  // Soreness scoring (optimal: 2-4)
  if (inputs.avgSoreness >= 6) {
    breakdown.soreness = -20;
    score -= 20;
    recommendations.push('Fatiga muscular excesiva. Reduce volumen 20% esta semana.');
  } else if (inputs.avgSoreness >= 4) {
    breakdown.soreness = -10;
    score -= 10;
    recommendations.push('Fatiga moderada. Mantén volumen pero evita aumentarlo.');
  } else if (inputs.avgSoreness < 2) {
    breakdown.soreness = -5;
    score -= 5;
    recommendations.push('Muy poca fatiga. Considera aumentar volumen si llevas >2 semanas así.');
  } else {
    breakdown.soreness = 0;
  }

  // Adherence scoring (optimal: >90%)
  if (inputs.adherence < 80) {
    breakdown.adherence = -10;
    score -= 10;
    recommendations.push('Baja adherencia (<80%). Revisa programación o factores de vida.');
  } else if (inputs.adherence < 90) {
    breakdown.adherence = -5;
    score -= 5;
  } else {
    breakdown.adherence = 0;
  }

  // Ensure score stays in 0-100 range
  score = Math.max(0, Math.min(100, score));

  // Determine category
  let category: 'good' | 'moderate' | 'poor';
  if (score >= 80) {
    category = 'good';
  } else if (score >= 60) {
    category = 'moderate';
    recommendations.push('Recuperación moderada. Monitorea de cerca y evita aumentar volumen.');
  } else {
    category = 'poor';
    recommendations.push('⚠️ CRÍTICO: Recuperación insuficiente. Reduce volumen 20% inmediatamente.');
  }

  return {
    score,
    category,
    breakdown,
    recommendations: recommendations.length > 0 ? recommendations : ['Recuperación óptima. Continúa con tu programación actual.'],
  };
}

/**
 * Integrate recovery score into volume adjustment algorithm
 * Called by calculateVolumeAdjustment() in algorithms.ts
 */
export function getVolumeMultiplierFromRecovery(score: number): number {
  if (score >= 80) {
    return 1.0; // No adjustment
  } else if (score >= 60) {
    return 0.9; // -10% volume
  } else {
    return 0.8; // -20% volume (critical)
  }
}

/**
 * Suggest optimal training frequency based on recovery score
 */
export function suggestTrainingFrequency(score: number, currentFrequency: number): {
  suggested: number;
  reason: string;
} {
  if (score >= 85 && currentFrequency < 6) {
    return {
      suggested: currentFrequency + 1,
      reason: 'Excelente recuperación. Puedes aumentar frecuencia semanal.',
    };
  } else if (score < 60 && currentFrequency > 3) {
    return {
      suggested: currentFrequency - 1,
      reason: 'Recuperación insuficiente. Reduce frecuencia para permitir adaptación.',
    };
  } else {
    return {
      suggested: currentFrequency,
      reason: 'Frecuencia actual es apropiada para tu capacidad de recuperación.',
    };
  }
}
