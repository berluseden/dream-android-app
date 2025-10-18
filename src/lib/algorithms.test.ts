import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateNextLoad,
  calculateE1RM,
  calculateE1RMWithRIR,
  detectPlateau,
  calculateVolumeAdjustment,
  calculateOptimalRIR,
  type SetHistory,
} from './algorithms';
import { mockSetHistory, mockPlateauHistory, mockHighRIRHistory } from '@/test/fixtures/sets';

describe('calculateE1RM', () => {
  it('should calculate e1RM using Epley formula', () => {
    const e1rm = calculateE1RM(100, 10);
    expect(e1rm).toBe(133); // 100 * (1 + 10/30) = 133.33 → 133
  });

  it('should handle 1 rep (1RM)', () => {
    const e1rm = calculateE1RM(150, 1);
    expect(e1rm).toBe(155); // 150 * (1 + 1/30) = 155
  });

  it('should handle heavy sets with low reps', () => {
    const e1rm = calculateE1RM(120, 5);
    expect(e1rm).toBe(140); // 120 * (1 + 5/30) = 140
  });

  it('should cache results for repeated calculations', () => {
    const first = calculateE1RM(100, 10);
    const second = calculateE1RM(100, 10);
    expect(first).toBe(second);
  });
});

describe('calculateE1RMWithRIR', () => {
  it('should adjust e1RM based on RIR', () => {
    // 80kg × 8 reps @ RIR 2
    // Total reps to failure: 8 + 2 = 10
    const e1rm = calculateE1RMWithRIR(80, 8, 2);
    expect(e1rm).toBe(107); // 80 * (1 + 10/30) = 106.67 → 107
  });

  it('should handle RIR 0 (to failure)', () => {
    const e1rm = calculateE1RMWithRIR(100, 10, 0);
    expect(e1rm).toBe(133); // Same as calculateE1RM(100, 10)
  });

  it('should handle high RIR values', () => {
    const e1rm = calculateE1RMWithRIR(80, 6, 4);
    // Total reps: 6 + 4 = 10
    expect(e1rm).toBe(107);
  });
});

describe('calculateNextLoad', () => {
  it('should increase load by 5% when RIR ≤ 0.5 and reps completed', () => {
    const history = [
      { load: 100, completed_reps: 10, rir_actual: 0, rpe: 10, created_at: new Date() },
      { load: 100, completed_reps: 10, rir_actual: 0, rpe: 10, created_at: new Date() },
      { load: 100, completed_reps: 10, rir_actual: 1, rpe: 9, created_at: new Date() },
    ];
    
    const suggestion = calculateNextLoad(history, 10);
    expect(suggestion.load).toBe(105); // 100 * 1.05
    expect(suggestion.reps).toBe(10);
    expect(suggestion.reason).toBe('+5% carga');
  });

  it('should increase reps when RIR ≤ 1.5', () => {
    // Create history with avgRir ≤ 1.5
    const history: SetHistory[] = [
      { load: 80, completed_reps: 10, rir_actual: 1, rpe: 9, created_at: new Date() },
      { load: 80, completed_reps: 9, rir_actual: 2, rpe: 8, created_at: new Date() },
      { load: 80, completed_reps: 10, rir_actual: 1, rpe: 9, created_at: new Date() },
    ];
    // avgRir = (1 + 2 + 1) / 3 = 1.33 ≤ 1.5
    const suggestion = calculateNextLoad(history, 10);
    expect(suggestion.load).toBe(80);
    expect(suggestion.reps).toBe(11);
    expect(suggestion.reason).toBe('Aumentar repeticiones');
  });

  it('should decrease load when RIR ≥ 3', () => {
    const suggestion = calculateNextLoad(mockHighRIRHistory, 10);
    // avgRir = (4 + 3 + 3) / 3 = 3.33
    expect(suggestion.load).toBe(54); // 60 * 0.90
    expect(suggestion.reason).toBe('Reducir carga: RIR alto');
  });

  it('should maintain load when RIR is optimal (1.5-3)', () => {
    const history = [
      { load: 90, completed_reps: 10, rir_actual: 2, rpe: 8, created_at: new Date() },
      { load: 90, completed_reps: 10, rir_actual: 2, rpe: 8, created_at: new Date() },
      { load: 90, completed_reps: 10, rir_actual: 2, rpe: 8, created_at: new Date() },
    ];
    
    const suggestion = calculateNextLoad(history, 10);
    expect(suggestion.load).toBe(90);
    expect(suggestion.reps).toBe(10);
    expect(suggestion.reason).toBe('Mantener');
  });

  it('should handle empty history', () => {
    const suggestion = calculateNextLoad([], 10);
    expect(suggestion.load).toBe(0);
    expect(suggestion.reason).toBe('Sin historial');
  });

  it('should provide alternative suggestions', () => {
    const history = [
      { load: 100, completed_reps: 10, rir_actual: 0, rpe: 10, created_at: new Date() },
      { load: 100, completed_reps: 10, rir_actual: 0, rpe: 10, created_at: new Date() },
      { load: 100, completed_reps: 10, rir_actual: 0, rpe: 10, created_at: new Date() },
    ];
    
    const suggestion = calculateNextLoad(history, 10);
    expect(suggestion.alternative).toBeDefined();
    expect(suggestion.alternative?.load).toBe(100);
    expect(suggestion.alternative?.reps).toBe(11);
  });
});

describe('detectPlateau', () => {
  it('should detect plateau after 3+ sessions without improvement', () => {
    const result = detectPlateau(mockPlateauHistory, 3);
    expect(result.isPlateaued).toBe(true);
    expect(result.sessionsWithoutImprovement).toBeGreaterThanOrEqual(3);
  });

  it('should not detect plateau with progression', () => {
    const history = [
      { load: 80, completed_reps: 8, rir_actual: 2, rpe: 8, created_at: new Date() },
      { load: 85, completed_reps: 8, rir_actual: 2, rpe: 8, created_at: new Date() },
      { load: 90, completed_reps: 8, rir_actual: 2, rpe: 8, created_at: new Date() },
    ];
    
    const result = detectPlateau(history, 3);
    expect(result.isPlateaued).toBe(false);
    expect(result.sessionsWithoutImprovement).toBe(0);
  });

  it('should handle insufficient data', () => {
    const result = detectPlateau(mockSetHistory.slice(0, 2), 3);
    expect(result.isPlateaued).toBe(false);
  });

  it('should use e1RM for comparison, not just load', () => {
    const history = [
      { load: 80, completed_reps: 10, rir_actual: 2, rpe: 8, created_at: new Date() }, // e1RM ≈ 107
      { load: 85, completed_reps: 8, rir_actual: 2, rpe: 8, created_at: new Date() },  // e1RM ≈ 113
      { load: 90, completed_reps: 6, rir_actual: 2, rpe: 8, created_at: new Date() },  // e1RM ≈ 114
    ];
    
    const result = detectPlateau(history, 3);
    expect(result.isPlateaued).toBe(false); // Progressing in e1RM
  });
});

describe('calculateVolumeAdjustment', () => {
  it('should reduce volume by 20% when soreness ≥ 6', () => {
    const pumpScores = [7, 8, 7];
    const sorenessScores = [7, 8, 6];
    
    const result = calculateVolumeAdjustment(pumpScores, sorenessScores);
    expect(result.adjustment).toBe(-0.2);
    expect(result.reason).toBe('Reducir volumen: fatiga excesiva');
  });

  it('should add 1 set when pump ≤ 3 and soreness ≤ 3', () => {
    const pumpScores = [3, 2, 3];
    const sorenessScores = [2, 3, 2];
    
    const result = calculateVolumeAdjustment(pumpScores, sorenessScores);
    expect(result.adjustment).toBe(1);
    expect(result.reason).toBe('Añadir 1 set: respuesta baja');
  });

  it('should maintain volume in optimal range', () => {
    const pumpScores = [7, 8, 7];
    const sorenessScores = [4, 5, 4];
    
    const result = calculateVolumeAdjustment(pumpScores, sorenessScores);
    expect(result.adjustment).toBe(0);
    expect(result.reason).toBe('Mantener volumen');
  });

  it('should handle empty data', () => {
    const result = calculateVolumeAdjustment([], []);
    expect(result.adjustment).toBe(0);
    expect(result.reason).toBe('Sin datos suficientes');
  });
});

describe('calculateOptimalRIR', () => {
  it('should return RIR 4 during deload week', () => {
    const rir = calculateOptimalRIR('compound', 8, 8);
    expect(rir).toBe(4);
  });

  it('should use conservative RIR for compound exercises early weeks', () => {
    const rir = calculateOptimalRIR('compound', 1, 6);
    expect(rir).toBe(3);
  });

  it('should decrease RIR for compound exercises in later weeks', () => {
    const rir = calculateOptimalRIR('compound', 5, 6);
    expect(rir).toBe(1);
  });

  it('should use more aggressive RIR for isolation exercises', () => {
    const rirEarly = calculateOptimalRIR('isolation', 1, 6);
    const rirMid = calculateOptimalRIR('isolation', 3, 6);
    const rirLate = calculateOptimalRIR('isolation', 5, 6);
    
    expect(rirEarly).toBe(2);
    expect(rirMid).toBe(1);
    expect(rirLate).toBe(0);
  });
});
