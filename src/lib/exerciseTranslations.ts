/**
 * Diccionario de traducciones de ejercicios Inglés → Español
 * Usado para mapear nombres de templates en inglés a nombres en español de la base de datos
 */
export const exerciseTranslations: Record<string, string> = {
  // PECHO (CHEST)
  'bench press': 'press de banca plano',
  'barbell bench press': 'press de banca plano',
  'flat barbell press': 'press de banca plano',
  'incline barbell press': 'press inclinado con barra',
  'incline bench press': 'press inclinado con barra',
  'flat dumbbell press': 'press con mancuernas plano',
  'dumbbell bench press': 'press con mancuernas plano',
  'incline dumbbell press': 'press inclinado con mancuernas',
  'dumbbell flyes': 'aperturas con mancuernas',
  'cable crossover': 'cruce de cables',
  'cable flyes': 'cruce de cables',
  'pec deck': 'aperturas en máquina',
  
  // ESPALDA (BACK)
  'deadlift': 'peso muerto',
  'romanian deadlift': 'peso muerto rumano',
  'rdl': 'peso muerto rumano',
  'pull-up': 'dominadas',
  'pull up': 'dominadas',
  'chin-up': 'dominadas agarre supino',
  'chin up': 'dominadas agarre supino',
  'neutral grip pull-up': 'dominadas agarre neutro',
  'barbell row': 'remo con barra',
  'bent over row': 'remo con barra',
  'dumbbell row': 'remo con mancuerna',
  'one arm dumbbell row': 'remo con mancuerna',
  'lat pulldown': 'jalón al pecho',
  'cable row': 'remo en polea baja',
  'seated cable row': 'remo en polea baja',
  'dumbbell pullover': 'pull-over con mancuerna',
  't-bar row': 'remo en t',
  
  // HOMBROS (SHOULDERS)
  'overhead press': 'press militar',
  'military press': 'press militar',
  'barbell overhead press': 'press militar',
  'dumbbell shoulder press': 'press con mancuernas sentado',
  'seated dumbbell press': 'press con mancuernas sentado',
  'machine shoulder press': 'press en máquina',
  'lateral raise': 'elevaciones laterales',
  'dumbbell lateral raise': 'elevaciones laterales',
  'side lateral raise': 'elevaciones laterales',
  'front raise': 'elevaciones frontales',
  'dumbbell front raise': 'elevaciones frontales',
  'rear delt fly': 'pájaros con mancuernas',
  'reverse fly': 'pájaros con mancuernas',
  'face pull': 'face pulls',
  'face pulls': 'face pulls',
  'arnold press': 'press arnold',
  
  // PIERNAS - CUÁDRICEPS (QUADS)
  'back squat': 'sentadilla con barra',
  'barbell squat': 'sentadilla con barra',
  'squat': 'sentadilla con barra',
  'front squat': 'sentadilla frontal',
  'leg press': 'prensa de piernas',
  'leg extension': 'extensiones de cuádriceps',
  'lunge': 'zancadas con mancuernas',
  'dumbbell lunge': 'zancadas con mancuernas',
  'walking lunge': 'zancadas con mancuernas',
  'bulgarian split squat': 'sentadilla búlgara',
  'split squat': 'sentadilla búlgara',
  'hack squat': 'hack squat',
  'goblet squat': 'sentadilla con mancuerna',
  
  // PIERNAS - ISQUIOTIBIALES (HAMSTRINGS)
  'leg curl': 'curl femoral acostado',
  'lying leg curl': 'curl femoral acostado',
  'seated leg curl': 'curl femoral sentado',
  'good morning': 'buenos días',
  'good mornings': 'buenos días',
  'nordic curl': 'curl nórdico',
  
  // GLÚTEOS (GLUTES)
  'hip thrust': 'hip thrust',
  'barbell hip thrust': 'hip thrust',
  'glute bridge': 'puente de glúteos',
  'sumo deadlift': 'peso muerto sumo',
  
  // PANTORRILLAS (CALVES)
  'calf raise': 'elevación de talones de pie',
  'standing calf raise': 'elevación de talones de pie',
  'calf raise (standing)': 'elevación de talones de pie',
  'seated calf raise': 'elevación de talones sentado',
  
  // BÍCEPS
  'barbell curl': 'curl con barra',
  'bicep curl': 'curl con barra',
  'dumbbell curl': 'curl con mancuernas',
  'hammer curl': 'curl martillo',
  'cable curl': 'curl en polea',
  'preacher curl': 'curl predicador',
  'ez bar curl': 'curl con barra z',
  'concentration curl': 'curl concentrado',
  
  // TRÍCEPS
  'skull crusher': 'press francés',
  'lying tricep extension': 'press francés',
  'dip': 'fondos en paralelas',
  'dips': 'fondos en paralelas',
  'tricep dip': 'fondos en paralelas',
  'cable overhead extension': 'extensión de tríceps en polea',
  'tricep pushdown': 'extensión de tríceps en polea',
  'cable tricep extension': 'extensión de tríceps en polea',
  'tricep kickback': 'patada de tríceps',
  'close grip bench press': 'press cerrado',
  'overhead tricep extension': 'extensión de tríceps sobre cabeza',
  
  // ABDOMINALES (ABS)
  'crunch': 'crunch abdominal',
  'leg raise': 'elevación de piernas',
  'hanging leg raise': 'elevación de piernas colgado',
  'plank': 'plancha abdominal',
  'russian twist': 'russian twist',
  'bicycle crunch': 'crunch bicicleta',
  'cable crunch': 'crunch en polea',
  'ab wheel': 'rueda abdominal',
};

/**
 * Busca la traducción de un nombre de ejercicio en inglés
 * @param englishName - Nombre del ejercicio en inglés (o mezclado)
 * @returns Nombre en español si existe traducción, o el original
 */
export function translateExerciseName(englishName: string): string {
  const normalized = englishName.toLowerCase().trim();
  
  // Buscar match exacto
  if (exerciseTranslations[normalized]) {
    return exerciseTranslations[normalized];
  }
  
  // Buscar match parcial (palabras clave)
  for (const [english, spanish] of Object.entries(exerciseTranslations)) {
    if (normalized.includes(english) || english.includes(normalized)) {
      return spanish;
    }
  }
  
  // No hay traducción, devolver original
  return englishName;
}
