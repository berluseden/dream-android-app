export interface Exercise {
  id: string;
  name: string;
  prime_muscle: string;
  secondary_muscles: string[];
  equipment: string[];
  is_compound: boolean;
  difficulty: string;
}

export type MovementPattern = 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'other';

export function getMovementPattern(exercise: Exercise): MovementPattern {
  const name = exercise.name.toLowerCase();
  
  // Push patterns
  if (name.includes('press') || name.includes('push') || name.includes('fondo') || 
      name.includes('extensi') && exercise.prime_muscle === 'triceps') {
    return 'push';
  }
  
  // Pull patterns
  if (name.includes('pull') || name.includes('row') || name.includes('remo') || 
      name.includes('dominada') || name.includes('jalón') || name.includes('curl')) {
    return 'pull';
  }
  
  // Squat patterns
  if (name.includes('squat') || name.includes('sentadilla') || 
      name.includes('leg press') || name.includes('extensión')) {
    return 'squat';
  }
  
  // Hinge patterns
  if (name.includes('deadlift') || name.includes('peso muerto') || 
      name.includes('good morning') || name.includes('hip thrust') ||
      name.includes('curl femoral')) {
    return 'hinge';
  }
  
  return 'other';
}

export function findSimilarExercises(
  targetExercise: Exercise,
  userEquipment: string[],
  allExercises: Exercise[]
): Exercise[] {
  const targetPattern = getMovementPattern(targetExercise);
  
  // Filter and score exercises
  const scored = allExercises
    .filter(ex => ex.id !== targetExercise.id) // Exclude the same exercise
    .map(ex => {
      let score = 0;
      
      // Same prime muscle: +50 points
      if (ex.prime_muscle === targetExercise.prime_muscle) {
        score += 50;
      }
      
      // Same movement pattern: +30 points
      if (getMovementPattern(ex) === targetPattern) {
        score += 30;
      }
      
      // Same compound/isolation: +20 points
      if (ex.is_compound === targetExercise.is_compound) {
        score += 20;
      }
      
      // Has at least one matching equipment: +15 points
      const hasMatchingEquipment = ex.equipment.some(eq => userEquipment.includes(eq));
      if (hasMatchingEquipment) {
        score += 15;
      }
      
      // Same or easier difficulty: +10 points
      const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      const targetDiff = difficultyOrder[targetExercise.difficulty as keyof typeof difficultyOrder] || 2;
      const exDiff = difficultyOrder[ex.difficulty as keyof typeof difficultyOrder] || 2;
      if (exDiff <= targetDiff) {
        score += 10;
      }
      
      // Overlapping secondary muscles: +5 points per overlap
      const secondaryOverlap = ex.secondary_muscles.filter(m =>
        targetExercise.secondary_muscles.includes(m)
      ).length;
      score += secondaryOverlap * 5;
      
      return { exercise: ex, score };
    })
    .filter(({ score }) => score >= 50) // Minimum threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 suggestions
  
  return scored.map(({ exercise }) => exercise);
}

export function getSubstitutionReasons() {
  return [
    { value: 'equipment', label: 'Equipo no disponible' },
    { value: 'injury', label: 'Dolor o lesión' },
    { value: 'preference', label: 'Preferencia personal' },
    { value: 'progression', label: 'Cambio por variación' },
    { value: 'other', label: 'Otro motivo' },
  ];
}