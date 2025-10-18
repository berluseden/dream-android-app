import { describe, it, expect } from 'vitest';
import {
  calculateRecoveryScore,
  getVolumeMultiplierFromRecovery,
  suggestTrainingFrequency,
} from './recovery';

describe('calculateRecoveryScore', () => {
  it('should return perfect score with optimal inputs', () => {
    const result = calculateRecoveryScore({
      sleepHours: 8,
      avgHRV: 70,
      restingHR: 60,
      avgSoreness: 3,
      adherence: 95,
    });
    
    expect(result.score).toBe(100);
    expect(result.category).toBe('good');
    expect(result.recommendations).toContain('Recuperación óptima. Continúa con tu programación actual.');
  });

  it('should penalize insufficient sleep', () => {
    const result = calculateRecoveryScore({
      sleepHours: 5,
      avgHRV: 70,
      restingHR: 60,
      avgSoreness: 3,
      adherence: 95,
    });
    
    expect(result.score).toBeLessThan(80);
    expect(result.recommendations.some(r => r.includes('sueño'))).toBe(true);
  });

  it('should penalize low HRV', () => {
    const result = calculateRecoveryScore({
      sleepHours: 8,
      avgHRV: 45,
      restingHR: 60,
      avgSoreness: 3,
      adherence: 95,
    });
    
    expect(result.score).toBeLessThan(85);
    expect(result.recommendations.some(r => r.includes('HRV'))).toBe(true);
  });

  it('should penalize high resting heart rate', () => {
    const result = calculateRecoveryScore({
      sleepHours: 8,
      avgHRV: 70,
      restingHR: 80,
      avgSoreness: 3,
      adherence: 95,
    });
    
    expect(result.score).toBeLessThan(90);
    expect(result.recommendations.some(r => r.includes('FC en reposo') || r.includes('estrés'))).toBe(true);
  });

  it('should penalize high soreness', () => {
    const result = calculateRecoveryScore({
      sleepHours: 8,
      avgHRV: 70,
      restingHR: 60,
      avgSoreness: 7,
      adherence: 95,
    });
    
    expect(result.score).toBeLessThan(85);
    expect(result.recommendations.some(r => r.includes('Fatiga muscular') || r.includes('volumen'))).toBe(true);
  });

  it('should penalize low adherence', () => {
    const result = calculateRecoveryScore({
      sleepHours: 8,
      avgHRV: 70,
      restingHR: 60,
      avgSoreness: 3,
      adherence: 70,
    });
    
    expect(result.score).toBeLessThan(95);
    expect(result.recommendations.some(r => r.includes('adherencia'))).toBe(true);
  });

  it('should categorize as moderate with score 60-79', () => {
    const result = calculateRecoveryScore({
      sleepHours: 6,
      avgHRV: 50,
      restingHR: 70,
      avgSoreness: 5,
      adherence: 80,
    });
    
    expect(result.category).toBe('moderate');
  });

  it('should categorize as poor with score < 60', () => {
    const result = calculateRecoveryScore({
      sleepHours: 5,
      avgHRV: 40,
      restingHR: 85,
      avgSoreness: 8,
      adherence: 60,
    });
    
    expect(result.category).toBe('poor');
  });
});

describe('getVolumeMultiplierFromRecovery', () => {
  it('should return 1.0 for good recovery', () => {
    expect(getVolumeMultiplierFromRecovery(85)).toBe(1.0);
    expect(getVolumeMultiplierFromRecovery(100)).toBe(1.0);
  });

  it('should return 0.9 for moderate recovery', () => {
    expect(getVolumeMultiplierFromRecovery(75)).toBe(0.9);
    expect(getVolumeMultiplierFromRecovery(60)).toBe(0.9);
  });

  it('should return 0.8 for poor recovery', () => {
    expect(getVolumeMultiplierFromRecovery(50)).toBe(0.8);
    expect(getVolumeMultiplierFromRecovery(30)).toBe(0.8);
  });
});

describe('suggestTrainingFrequency', () => {
  it('should suggest increasing frequency for excellent recovery', () => {
    const result = suggestTrainingFrequency(95, 5);
    expect(result.suggested).toBe(6);
    expect(result.reason).toContain('Excelente');
  });

  it('should suggest maintaining frequency for good recovery at max', () => {
    const result = suggestTrainingFrequency(90, 6);
    expect(result.suggested).toBe(6);
    expect(result.reason).toContain('apropiada');
  });

  it('should suggest maintaining frequency for moderate recovery', () => {
    const result = suggestTrainingFrequency(65, 4);
    expect(result.suggested).toBe(4);
    expect(result.reason).toContain('apropiada');
  });

  it('should suggest decreasing frequency for poor recovery', () => {
    const result = suggestTrainingFrequency(45, 5);
    expect(result.suggested).toBe(4);
    expect(result.reason).toContain('Reduce frecuencia');
  });

  it('should not decrease below 3 days', () => {
    const result = suggestTrainingFrequency(30, 3);
    expect(result.suggested).toBe(3);
    expect(result.reason).toContain('apropiada');
  });
});
