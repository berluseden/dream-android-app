/**
 * Nutrition Tracking System
 * Based on:
 * - Morton et al. (2024): Nutritional Determinants of Muscle Hypertrophy
 * - Helms et al. (2023): Evidence-based recommendations for natural bodybuilding contest preparation
 * 
 * Protein: 1.6-2.2 g/kg bodyweight (hypertrophy)
 * Calories: Based on Mifflin-St Jeor with activity multiplier
 */

export interface NutritionProfile {
  user_id: string;
  bodyweight: number;        // kg
  height: number;            // cm
  age: number;
  biological_sex: 'male' | 'female';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
  goal: 'cut' | 'maintain' | 'bulk';
}

export interface NutritionEntry {
  id: string;
  user_id: string;
  date: Date;
  calories: number;
  protein: number;           // grams
  carbs?: number;            // grams
  fats?: number;             // grams
  bodyweight?: number;       // kg (weekly weigh-in)
  notes?: string;
  created_at: Date;
}

export interface NutritionRequirements {
  tdee: number;              // Total Daily Energy Expenditure
  bmr: number;               // Basal Metabolic Rate
  targetCalories: number;    // Based on goal
  targetProtein: number;     // grams
  proteinPerKg: number;      // g/kg
}

export interface NutritionCompliance {
  calorieCompliance: number;   // % (90-110% = compliant)
  proteinCompliance: number;   // % (≥90% = compliant)
  avgCalories: number;
  avgProtein: number;
  avgBodyweight: number | null;
  status: 'compliant' | 'attention' | 'critical';
  alerts: string[];
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 * Most accurate for general population
 * 
 * Men: BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
 * Women: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161
 */
export function calculateBMR(profile: NutritionProfile): number {
  const { bodyweight, height, age, biological_sex } = profile;

  const baseBMR = (10 * bodyweight) + (6.25 * height) - (5 * age);

  if (biological_sex === 'male') {
    return baseBMR + 5;
  } else {
    return baseBMR - 161;
  }
}

/**
 * Calculate TDEE using activity multipliers
 */
export function calculateTDEE(profile: NutritionProfile): number {
  const bmr = calculateBMR(profile);

  const activityMultipliers = {
    sedentary: 1.2,        // Little to no exercise
    light: 1.375,          // Exercise 1-3 days/week
    moderate: 1.55,        // Exercise 3-5 days/week
    very_active: 1.725,    // Exercise 6-7 days/week
    extra_active: 1.9,     // Physical job + exercise daily
  };

  return Math.round(bmr * activityMultipliers[profile.activity_level]);
}

/**
 * Calculate nutrition requirements
 */
export function calculateNutritionRequirements(profile: NutritionProfile): NutritionRequirements {
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(profile);

  // Adjust calories based on goal
  let targetCalories: number;
  if (profile.goal === 'cut') {
    targetCalories = Math.round(tdee * 0.80); // -20% deficit
  } else if (profile.goal === 'bulk') {
    targetCalories = Math.round(tdee * 1.10); // +10% surplus
  } else {
    targetCalories = tdee; // Maintenance
  }

  // Protein: 1.8 g/kg as baseline (middle of 1.6-2.2 range)
  // Increase to 2.0-2.2 during cut to preserve muscle
  let proteinPerKg: number;
  if (profile.goal === 'cut') {
    proteinPerKg = 2.0;
  } else if (profile.goal === 'bulk') {
    proteinPerKg = 1.8;
  } else {
    proteinPerKg = 1.8;
  }

  const targetProtein = Math.round(profile.bodyweight * proteinPerKg);

  return {
    bmr,
    tdee,
    targetCalories,
    targetProtein,
    proteinPerKg,
  };
}

/**
 * Analyze nutrition compliance over a period
 */
export function analyzeNutritionCompliance(
  entries: NutritionEntry[],
  requirements: NutritionRequirements
): NutritionCompliance {
  if (entries.length === 0) {
    return {
      calorieCompliance: 0,
      proteinCompliance: 0,
      avgCalories: 0,
      avgProtein: 0,
      avgBodyweight: null,
      status: 'critical',
      alerts: ['Sin datos de nutrición registrados'],
    };
  }

  const avgCalories = entries.reduce((sum, e) => sum + e.calories, 0) / entries.length;
  const avgProtein = entries.reduce((sum, e) => sum + e.protein, 0) / entries.length;

  const weighIns = entries.filter(e => e.bodyweight != null);
  const avgBodyweight = weighIns.length > 0
    ? weighIns.reduce((sum, e) => sum + (e.bodyweight || 0), 0) / weighIns.length
    : null;

  // Compliance percentages
  const calorieCompliance = (avgCalories / requirements.targetCalories) * 100;
  const proteinCompliance = (avgProtein / requirements.targetProtein) * 100;

  const alerts: string[] = [];

  // Critical alerts
  if (proteinCompliance < 80) {
    alerts.push(`⚠️ CRÍTICO: Proteína muy baja (${avgProtein.toFixed(0)}g vs ${requirements.targetProtein}g target). Riesgo de pérdida muscular.`);
  }

  if (calorieCompliance < 75) {
    alerts.push(`⚠️ CRÍTICO: Déficit excesivo (-${(100 - calorieCompliance).toFixed(0)}%). Riesgo de pérdida muscular y fatiga.`);
  }

  if (calorieCompliance > 125) {
    alerts.push(`⚠️ Superávit excesivo (+${(calorieCompliance - 100).toFixed(0)}%). Riesgo de ganancia de grasa innecesaria.`);
  }

  // Warnings
  if (proteinCompliance >= 80 && proteinCompliance < 90) {
    alerts.push(`Proteína subóptima (${avgProtein.toFixed(0)}g). Apunta a ${requirements.targetProtein}g diarios.`);
  }

  if (calorieCompliance >= 75 && calorieCompliance < 90) {
    alerts.push(`Calorías bajas. Considera aumentar a ${requirements.targetCalories} kcal/día.`);
  }

  if (calorieCompliance > 110 && calorieCompliance <= 125) {
    alerts.push(`Ligero superávit. Monitorea ganancia de peso semanal.`);
  }

  // Good compliance
  if (proteinCompliance >= 90 && calorieCompliance >= 90 && calorieCompliance <= 110) {
    alerts.push('✅ Nutrición óptima. Continúa así.');
  }

  // Determine status
  let status: 'compliant' | 'attention' | 'critical';
  if (proteinCompliance < 80 || calorieCompliance < 75 || calorieCompliance > 125) {
    status = 'critical';
  } else if (proteinCompliance < 90 || calorieCompliance < 90 || calorieCompliance > 110) {
    status = 'attention';
  } else {
    status = 'compliant';
  }

  return {
    calorieCompliance,
    proteinCompliance,
    avgCalories: Math.round(avgCalories),
    avgProtein: Math.round(avgProtein),
    avgBodyweight,
    status,
    alerts,
  };
}

/**
 * Suggest calorie adjustment based on bodyweight trend
 * For bulking: aim for 0.25-0.5% bodyweight gain per week
 * For cutting: aim for 0.5-1% bodyweight loss per week
 */
export function suggestCalorieAdjustment(
  weighIns: { date: Date; bodyweight: number }[],
  goal: 'cut' | 'maintain' | 'bulk',
  currentCalories: number
): {
  adjustment: number;
  reason: string;
} {
  if (weighIns.length < 2) {
    return {
      adjustment: 0,
      reason: 'Insuficientes datos de peso. Registra al menos 2 semanas.',
    };
  }

  // Sort by date
  const sorted = [...weighIns].sort((a, b) => a.date.getTime() - b.date.getTime());
  const firstWeight = sorted[0].bodyweight;
  const lastWeight = sorted[sorted.length - 1].bodyweight;
  const weeks = (sorted[sorted.length - 1].date.getTime() - sorted[0].date.getTime()) / (7 * 24 * 60 * 60 * 1000);

  if (weeks < 1) {
    return {
      adjustment: 0,
      reason: 'Insuficiente tiempo transcurrido. Espera al menos 1 semana.',
    };
  }

  const weightChange = lastWeight - firstWeight;
  const weeklyChange = weightChange / weeks;
  const percentChange = (weeklyChange / firstWeight) * 100;

  if (goal === 'bulk') {
    const targetMin = firstWeight * 0.0025; // 0.25%
    const targetMax = firstWeight * 0.005;  // 0.5%

    if (weeklyChange < targetMin) {
      return {
        adjustment: 200,
        reason: `Ganancia de peso insuficiente (${weeklyChange.toFixed(2)}kg/sem). Aumenta calorías.`,
      };
    } else if (weeklyChange > targetMax) {
      return {
        adjustment: -100,
        reason: `Ganancia de peso excesiva (${weeklyChange.toFixed(2)}kg/sem). Reduce calorías.`,
      };
    } else {
      return {
        adjustment: 0,
        reason: `Ganancia de peso óptima (${weeklyChange.toFixed(2)}kg/sem). Mantén calorías.`,
      };
    }
  } else if (goal === 'cut') {
    const targetMin = firstWeight * -0.01;  // -1%
    const targetMax = firstWeight * -0.005; // -0.5%

    if (weeklyChange > targetMax) {
      return {
        adjustment: -100,
        reason: `Pérdida de peso insuficiente (${weeklyChange.toFixed(2)}kg/sem). Reduce calorías.`,
      };
    } else if (weeklyChange < targetMin) {
      return {
        adjustment: 100,
        reason: `Pérdida de peso excesiva (${weeklyChange.toFixed(2)}kg/sem). Aumenta calorías.`,
      };
    } else {
      return {
        adjustment: 0,
        reason: `Pérdida de peso óptima (${weeklyChange.toFixed(2)}kg/sem). Mantén calorías.`,
      };
    }
  } else {
    // Maintain
    if (Math.abs(percentChange) > 0.25) {
      const direction = weeklyChange > 0 ? -100 : 100;
      return {
        adjustment: direction,
        reason: `Peso variando (${weeklyChange.toFixed(2)}kg/sem). Ajusta calorías para mantener.`,
      };
    } else {
      return {
        adjustment: 0,
        reason: 'Peso estable. Mantén calorías actuales.',
      };
    }
  }
}
