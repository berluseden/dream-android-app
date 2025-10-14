export type MovementPattern = 'squat' | 'bench' | 'row' | 'overhead_press' | 'deadlift' | 'other';

export interface StrengthProfile {
  id: string;
  user_id: string;
  pattern: MovementPattern;
  e1rm: number;
  last_calibration_date: Date;
  calibration_data: {
    load: number;
    reps: number;
    rir: number;
  };
}

export interface PlatePreferences {
  bar_type: 'olympic' | 'standard' | 'ez';
  bar_weight: number; // kg
  available_plates: number[]; // [20, 15, 10, 5, 2.5, 1.25, 0.5]
}

export interface WarmupSet {
  load: number;
  reps: number;
  percentage: number;
}
