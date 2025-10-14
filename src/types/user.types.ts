export type UserRole = 'admin' | 'coach' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  equipment: string[];
  level: 'novato' | 'intermedio' | 'avanzado';
  experience_years: number;
  goals: string;
  units: 'kg' | 'lb';
  coach_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
}

export interface CoachProfile {
  id: string;
  specializations: string[];
  certifications: string[];
  max_clients: number;
  current_clients: number;
}

export interface Muscle {
  id: string;
  name: string;
  display_name: string;
  category: 'upper' | 'lower' | 'core';
}

export interface Exercise {
  id: string;
  name: string;
  prime_muscle: string;
  secondary_muscles: string[];
  equipment: string[];
  video_url?: string;
  thumbnail_url?: string;
  muscle_diagram?: string;
  description: string;
  instructions: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  difficulty_level?: 1 | 2 | 3;
  is_compound: boolean;
  created_by: string | null;
  default_rest_seconds?: number;
  default_reps_min?: number;
  default_reps_max?: number;
}

export interface ExerciseFeedback {
  id: string;
  workout_id: string;
  exercise_id: string;
  muscle_soreness: 'never_sore' | 'healed_while_ago' | 'just_on_time' | 'still_sore';
  pump_quality: 'low' | 'moderate' | 'amazing';
  workload_feeling: 'easy' | 'pretty_good' | 'pushed_limits' | 'too_much';
  notes?: string;
  created_at: Date;
}
