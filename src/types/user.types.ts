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
  description: string;
  instructions: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_compound: boolean;
  created_by: string | null;
}
