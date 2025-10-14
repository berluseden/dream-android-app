import { WarmupSet } from '@/types/strength.types';

/**
 * Generate warmup sets for compound exercises
 * Based on working set load
 */
export function generateWarmups(workingLoad: number, isCompound: boolean = true): WarmupSet[] {
  if (!isCompound || workingLoad < 40) {
    return [];
  }

  const warmups: WarmupSet[] = [
    { percentage: 0.5, reps: 8, load: Math.round((workingLoad * 0.5) / 2.5) * 2.5 },
    { percentage: 0.65, reps: 6, load: Math.round((workingLoad * 0.65) / 2.5) * 2.5 },
    { percentage: 0.80, reps: 3, load: Math.round((workingLoad * 0.80) / 2.5) * 2.5 },
  ];

  return warmups;
}

/**
 * Determine if an exercise is compound based on name patterns
 */
export function isCompoundExercise(exerciseName: string): boolean {
  const compoundPatterns = [
    'squat',
    'deadlift',
    'bench',
    'press',
    'row',
    'pull-up',
    'chin-up',
    'dip',
    'lunge',
    'sentadilla',
    'peso muerto',
    'press',
    'remo',
    'dominada',
  ];

  const nameLower = exerciseName.toLowerCase();
  return compoundPatterns.some(pattern => nameLower.includes(pattern));
}
