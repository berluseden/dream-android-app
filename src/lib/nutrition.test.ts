import { describe, it, expect } from 'vitest';
import {
  calculateBMR,
  calculateTDEE,
  calculateNutritionRequirements,
  analyzeNutritionCompliance,
  suggestCalorieAdjustment,
} from './nutrition';

describe('calculateBMR', () => {
  it('should calculate BMR for male using Mifflin-St Jeor', () => {
    const bmr = calculateBMR(80, 180, 30, 'male');
    // BMR = (10 * 80) + (6.25 * 180) - (5 * 30) + 5
    // BMR = 800 + 1125 - 150 + 5 = 1780
    expect(bmr).toBe(1780);
  });

  it('should calculate BMR for female using Mifflin-St Jeor', () => {
    const bmr = calculateBMR(60, 165, 25, 'female');
    // BMR = (10 * 60) + (6.25 * 165) - (5 * 25) - 161
    // BMR = 600 + 1031.25 - 125 - 161 = 1345.25
    expect(bmr).toBe(1345.25);
  });
});

describe('calculateTDEE', () => {
  it('should calculate TDEE for sedentary activity', () => {
    const bmr = 1780;
    const tdee = calculateTDEE(bmr, 'sedentary');
    expect(tdee).toBe(2136); // 1780 * 1.2
  });

  it('should calculate TDEE for very active', () => {
    const bmr = 1780;
    const tdee = calculateTDEE(bmr, 'very_active');
    expect(tdee).toBe(3026); // 1780 * 1.7
  });
});

describe('calculateNutritionRequirements', () => {
  it('should calculate requirements for cutting', () => {
    const req = calculateNutritionRequirements(80, 180, 30, 'male', 'moderately_active', 'cut');
    
    expect(req.bmr).toBe(1780);
    expect(req.tdee).toBe(2670); // 1780 * 1.5
    expect(req.targetCalories).toBe(2136); // 2670 * 0.8 (-20%)
    expect(req.targetProtein).toBe(160); // 80 * 2.0
    expect(req.proteinCalories).toBe(640); // 160 * 4
  });

  it('should calculate requirements for bulking', () => {
    const req = calculateNutritionRequirements(70, 175, 25, 'male', 'lightly_active', 'bulk');
    
    const bmr = (10 * 70) + (6.25 * 175) - (5 * 25) + 5;
    const tdee = bmr * 1.375;
    expect(req.targetCalories).toBe(Math.round(tdee * 1.1)); // +10%
    expect(req.targetProtein).toBe(126); // 70 * 1.8
  });

  it('should calculate requirements for maintaining', () => {
    const req = calculateNutritionRequirements(75, 178, 28, 'female', 'moderately_active', 'maintain');
    
    const bmr = (10 * 75) + (6.25 * 178) - (5 * 28) - 161;
    const tdee = bmr * 1.5;
    expect(req.targetCalories).toBe(Math.round(tdee)); // No adjustment
    expect(req.targetProtein).toBe(135); // 75 * 1.8
  });
});

describe('analyzeNutritionCompliance', () => {
  const targetProtein = 150;
  const targetCalories = 2500;

  it('should return compliant for good adherence', () => {
    const result = analyzeNutritionCompliance(145, 2480, targetProtein, targetCalories);
    
    expect(result.proteinCompliance).toBe('compliant');
    expect(result.calorieCompliance).toBe('compliant');
    expect(result.alerts).toHaveLength(0);
  });

  it('should alert on low protein', () => {
    const result = analyzeNutritionCompliance(110, 2500, targetProtein, targetCalories);
    
    expect(result.proteinCompliance).toBe('low');
    expect(result.alerts).toContain('Proteína < 80% del objetivo');
  });

  it('should alert on excessive calorie deficit', () => {
    const result = analyzeNutritionCompliance(150, 1800, targetProtein, targetCalories);
    
    expect(result.calorieCompliance).toBe('low');
    expect(result.alerts).toContain('Déficit calórico > 25%');
  });

  it('should alert on excessive calorie surplus', () => {
    const result = analyzeNutritionCompliance(150, 3200, targetProtein, targetCalories);
    
    expect(result.calorieCompliance).toBe('high');
    expect(result.alerts).toContain('Superávit calórico > 25%');
  });
});

describe('suggestCalorieAdjustment', () => {
  it('should suggest reducing calories if gaining too fast when cutting', () => {
    const result = suggestCalorieAdjustment(0.8, 'cut');
    
    expect(result.adjustment).toBe(-100);
    expect(result.reason).toContain('ganando peso');
  });

  it('should suggest increasing calories if not gaining when bulking', () => {
    const result = suggestCalorieAdjustment(-0.2, 'bulk');
    
    expect(result.adjustment).toBe(150);
    expect(result.reason).toContain('perdiendo peso');
  });

  it('should suggest maintaining calories if trend is appropriate', () => {
    const result = suggestCalorieAdjustment(-0.5, 'cut');
    
    expect(result.adjustment).toBe(0);
    expect(result.reason).toContain('apropiada');
  });

  it('should suggest maintaining calories for maintenance goal', () => {
    const result = suggestCalorieAdjustment(0.3, 'maintain');
    
    expect(result.adjustment).toBe(0);
    expect(result.reason).toContain('apropiado');
  });
});
