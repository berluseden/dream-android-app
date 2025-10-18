import { describe, it, expect } from 'vitest';
import {
  calculateBMR,
  calculateTDEE,
  calculateNutritionRequirements,
  analyzeNutritionCompliance,
  suggestCalorieAdjustment,
  type NutritionProfile,
  type NutritionEntry,
  type NutritionRequirements,
} from './nutrition';

describe('calculateBMR', () => {
  it('should calculate BMR for male using Mifflin-St Jeor', () => {
    const profile: NutritionProfile = {
      user_id: 'test',
      bodyweight: 80,
      height: 180,
      age: 30,
      biological_sex: 'male',
      activity_level: 'moderate',
      goal: 'maintain',
    };
    const bmr = calculateBMR(profile);
    // BMR = (10 * 80) + (6.25 * 180) - (5 * 30) + 5
    // BMR = 800 + 1125 - 150 + 5 = 1780
    expect(bmr).toBe(1780);
  });

  it('should calculate BMR for female using Mifflin-St Jeor', () => {
    const profile: NutritionProfile = {
      user_id: 'test',
      bodyweight: 60,
      height: 165,
      age: 25,
      biological_sex: 'female',
      activity_level: 'moderate',
      goal: 'maintain',
    };
    const bmr = calculateBMR(profile);
    // BMR = (10 * 60) + (6.25 * 165) - (5 * 25) - 161
    // BMR = 600 + 1031.25 - 125 - 161 = 1345.25
    expect(bmr).toBe(1345.25);
  });
});

describe('calculateTDEE', () => {
  it('should calculate TDEE for sedentary activity', () => {
    const profile: NutritionProfile = {
      user_id: 'test',
      bodyweight: 80,
      height: 180,
      age: 30,
      biological_sex: 'male',
      activity_level: 'sedentary',
      goal: 'maintain',
    };
    const tdee = calculateTDEE(profile);
    expect(tdee).toBe(2136); // 1780 * 1.2
  });

  it('should calculate TDEE for very active', () => {
    const profile: NutritionProfile = {
      user_id: 'test',
      bodyweight: 80,
      height: 180,
      age: 30,
      biological_sex: 'male',
      activity_level: 'very_active',
      goal: 'maintain',
    };
    const tdee = calculateTDEE(profile);
    expect(tdee).toBe(3071); // 1780 * 1.725 rounded
  });
});

describe('calculateNutritionRequirements', () => {
  it('should calculate requirements for cutting', () => {
    const profile: NutritionProfile = {
      user_id: 'test',
      bodyweight: 80,
      height: 180,
      age: 30,
      biological_sex: 'male',
      activity_level: 'moderate',
      goal: 'cut',
    };
    const req = calculateNutritionRequirements(profile);
    
    expect(req.bmr).toBe(1780);
    expect(req.tdee).toBe(2759); // 1780 * 1.55 rounded
    expect(req.targetCalories).toBe(2207); // 2759 * 0.8 (-20%)
    expect(req.targetProtein).toBe(160); // 80 * 2.0
  });

  it('should calculate requirements for bulking', () => {
    const profile: NutritionProfile = {
      user_id: 'test',
      bodyweight: 70,
      height: 175,
      age: 25,
      biological_sex: 'male',
      activity_level: 'light',
      goal: 'bulk',
    };
    const req = calculateNutritionRequirements(profile);
    
    const bmr = (10 * 70) + (6.25 * 175) - (5 * 25) + 5;
    const tdee = Math.round(bmr * 1.375);
    expect(req.targetCalories).toBe(Math.round(tdee * 1.1)); // +10%
    expect(req.targetProtein).toBe(126); // 70 * 1.8
  });

  it('should calculate requirements for maintaining', () => {
    const profile: NutritionProfile = {
      user_id: 'test',
      bodyweight: 75,
      height: 178,
      age: 28,
      biological_sex: 'female',
      activity_level: 'moderate',
      goal: 'maintain',
    };
    const req = calculateNutritionRequirements(profile);
    
    const bmr = (10 * 75) + (6.25 * 178) - (5 * 28) - 161;
    const tdee = Math.round(bmr * 1.55);
    expect(req.targetCalories).toBe(tdee); // No adjustment
    expect(req.targetProtein).toBe(135); // 75 * 1.8
  });
});

describe('analyzeNutritionCompliance', () => {
  const requirements: NutritionRequirements = {
    bmr: 1780,
    tdee: 2670,
    targetCalories: 2500,
    targetProtein: 150,
    proteinPerKg: 1.8,
  };

  it('should return compliant for good adherence', () => {
    const entries: NutritionEntry[] = [
      { id: '1', user_id: 'test', date: new Date(), calories: 2480, protein: 145, created_at: new Date() },
      { id: '2', user_id: 'test', date: new Date(), calories: 2520, protein: 152, created_at: new Date() },
      { id: '3', user_id: 'test', date: new Date(), calories: 2500, protein: 150, created_at: new Date() },
    ];
    const result = analyzeNutritionCompliance(entries, requirements);
    
    expect(result.proteinCompliance).toBeGreaterThanOrEqual(90);
    expect(result.calorieCompliance).toBeGreaterThanOrEqual(90);
    expect(result.calorieCompliance).toBeLessThanOrEqual(110);
    expect(result.status).toBe('compliant');
  });

  it('should alert on low protein', () => {
    const entries: NutritionEntry[] = [
      { id: '1', user_id: 'test', date: new Date(), calories: 2500, protein: 110, created_at: new Date() },
      { id: '2', user_id: 'test', date: new Date(), calories: 2500, protein: 115, created_at: new Date() },
    ];
    const result = analyzeNutritionCompliance(entries, requirements);
    
    expect(result.proteinCompliance).toBeLessThan(80);
    expect(result.status).toBe('critical');
    expect(result.alerts.some(a => a.includes('CRÍTICO'))).toBe(true);
  });

  it('should alert on excessive calorie deficit', () => {
    const entries: NutritionEntry[] = [
      { id: '1', user_id: 'test', date: new Date(), calories: 1800, protein: 150, created_at: new Date() },
      { id: '2', user_id: 'test', date: new Date(), calories: 1850, protein: 150, created_at: new Date() },
    ];
    const result = analyzeNutritionCompliance(entries, requirements);
    
    expect(result.calorieCompliance).toBeLessThan(75);
    expect(result.status).toBe('critical');
    expect(result.alerts.some(a => a.includes('Déficit excesivo'))).toBe(true);
  });

  it('should alert on excessive calorie surplus', () => {
    const entries: NutritionEntry[] = [
      { id: '1', user_id: 'test', date: new Date(), calories: 3200, protein: 150, created_at: new Date() },
      { id: '2', user_id: 'test', date: new Date(), calories: 3100, protein: 150, created_at: new Date() },
    ];
    const result = analyzeNutritionCompliance(entries, requirements);
    
    expect(result.calorieCompliance).toBeGreaterThan(125);
    expect(result.status).toBe('critical');
    expect(result.alerts.some(a => a.includes('Superávit excesivo'))).toBe(true);
  });
});

describe('suggestCalorieAdjustment', () => {
  const currentCalories = 2500;

  it('should suggest reducing calories if losing weight too slowly when cutting', () => {
    const weighIns = [
      { date: new Date('2024-01-01'), bodyweight: 80 },
      { date: new Date('2024-01-08'), bodyweight: 79.95 }, // -0.05kg/week (too slow, target: -0.4 to -0.8)
    ];
    const result = suggestCalorieAdjustment(weighIns, 'cut', currentCalories);
    
    expect(result.adjustment).toBe(-100);
    expect(result.reason).toContain('insuficiente');
  });

  it('should suggest increasing calories if not gaining enough when bulking', () => {
    const weighIns = [
      { date: new Date('2024-01-01'), bodyweight: 70 },
      { date: new Date('2024-01-08'), bodyweight: 69.95 }, // -0.05kg/week (losing, should be gaining 0.175-0.35)
    ];
    const result = suggestCalorieAdjustment(weighIns, 'bulk', currentCalories);
    
    expect(result.adjustment).toBe(200);
    expect(result.reason).toContain('insuficiente');
  });

  it('should suggest maintaining calories if cut trend is appropriate', () => {
    const weighIns = [
      { date: new Date('2024-01-01'), bodyweight: 80 },
      { date: new Date('2024-01-08'), bodyweight: 79.5 }, // -0.5kg/week (optimal for cutting)
    ];
    const result = suggestCalorieAdjustment(weighIns, 'cut', currentCalories);
    
    expect(result.adjustment).toBe(0);
    expect(result.reason).toContain('óptima');
  });

  it('should suggest adjusting calories if weight varies during maintenance', () => {
    const weighIns = [
      { date: new Date('2024-01-01'), bodyweight: 75 },
      { date: new Date('2024-01-08'), bodyweight: 75.2 }, // +0.2kg/week (0.27% change, above 0.25% threshold)
    ];
    const result = suggestCalorieAdjustment(weighIns, 'maintain', currentCalories);
    
    expect(result.adjustment).toBe(-100);
    expect(result.reason).toContain('variando');
  });

  it('should maintain calories if weight is stable during maintenance', () => {
    const weighIns = [
      { date: new Date('2024-01-01'), bodyweight: 75 },
      { date: new Date('2024-01-08'), bodyweight: 75.1 }, // +0.1kg/week (0.13% change, below 0.25% threshold)
    ];
    const result = suggestCalorieAdjustment(weighIns, 'maintain', currentCalories);
    
    expect(result.adjustment).toBe(0);
    expect(result.reason).toContain('estable');
  });
});
