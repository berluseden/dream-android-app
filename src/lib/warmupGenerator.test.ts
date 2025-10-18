import { describe, it, expect } from 'vitest';
import { generateWarmups, isCompoundExercise } from './warmupGenerator';

describe('isCompoundExercise', () => {
  it('should detect squat variations', () => {
    expect(isCompoundExercise('Barbell Squat')).toBe(true);
    expect(isCompoundExercise('Front Squat')).toBe(true);
    expect(isCompoundExercise('Back Squat')).toBe(true);
  });

  it('should detect deadlift variations', () => {
    expect(isCompoundExercise('Conventional Deadlift')).toBe(true);
    expect(isCompoundExercise('Romanian Deadlift')).toBe(true);
    expect(isCompoundExercise('Sumo Deadlift')).toBe(true);
  });

  it('should detect bench press variations', () => {
    expect(isCompoundExercise('Bench Press')).toBe(true);
    expect(isCompoundExercise('Incline Bench Press')).toBe(true);
  });

  it('should detect row variations', () => {
    expect(isCompoundExercise('Barbell Row')).toBe(true);
    expect(isCompoundExercise('Pendlay Row')).toBe(true);
  });

  it('should detect overhead press variations', () => {
    expect(isCompoundExercise('Overhead Press')).toBe(true);
    expect(isCompoundExercise('Military Press')).toBe(true);
  });

  it('should detect pull-ups and dips', () => {
    expect(isCompoundExercise('Pull-up')).toBe(true);
    expect(isCompoundExercise('Chin-up')).toBe(true);
    expect(isCompoundExercise('Weighted Dips')).toBe(true);
  });

  it('should not detect isolation exercises', () => {
    expect(isCompoundExercise('Bicep Curl')).toBe(false);
    expect(isCompoundExercise('Tricep Extension')).toBe(false);
    expect(isCompoundExercise('Lateral Raise')).toBe(false);
    expect(isCompoundExercise('Leg Extension')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(isCompoundExercise('SQUAT')).toBe(true);
    expect(isCompoundExercise('bench press')).toBe(true);
  });
});

describe('generateWarmups', () => {
  it('should generate 3 warmup sets for compound exercises', () => {
    const warmups = generateWarmups(100, true);
    
    expect(warmups).toHaveLength(3);
    expect(warmups[0]).toEqual({ load: 50, reps: 8, percentage: 0.5 });  // 50%
    expect(warmups[1]).toEqual({ load: 65, reps: 6, percentage: 0.65 });  // 65%
    expect(warmups[2]).toEqual({ load: 80, reps: 3, percentage: 0.80 });  // 80%
  });

  it('should not generate warmups for isolation exercises', () => {
    const warmups = generateWarmups(100, false);
    expect(warmups).toHaveLength(0);
  });

  it('should not generate warmups for light loads (< 40kg)', () => {
    const warmups = generateWarmups(35, true);
    expect(warmups).toHaveLength(0);
  });

  it('should round to nearest 2.5kg', () => {
    const warmups = generateWarmups(83, true);
    
    // 83 * 0.50 = 41.5 → 42.5
    // 83 * 0.65 = 53.95 → 55
    // 83 * 0.80 = 66.4 → 67.5
    expect(warmups[0].load).toBe(42.5);
    expect(warmups[1].load).toBe(55);
    expect(warmups[2].load).toBe(67.5);
  });

  it('should handle heavy loads correctly', () => {
    const warmups = generateWarmups(200, true);
    
    expect(warmups[0].load).toBe(100); // 50%
    expect(warmups[1].load).toBe(130); // 65%
    expect(warmups[2].load).toBe(160); // 80%
  });

  it('should maintain correct rep scheme', () => {
    const warmups = generateWarmups(150, true);
    
    warmups.forEach((warmup, index) => {
      if (index === 0) expect(warmup.reps).toBe(8);
      if (index === 1) expect(warmup.reps).toBe(6);
      if (index === 2) expect(warmup.reps).toBe(3);
    });
  });
});
