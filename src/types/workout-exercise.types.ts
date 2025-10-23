import { Timestamp } from 'firebase/firestore';

/**
 * Ejercicio asignado a un workout específico
 * Esta tabla vincula workouts con ejercicios del programa
 */
export interface WorkoutExercise {
  id: string;
  workout_id: string;
  user_id: string;                // Denormalizado para RLS
  exercise_id: string;            // FK a exercises (puede ser null si ejercicio custom)
  exercise_name: string;          // Denormalizado para preservar historial
  order: number;                  // Orden en la sesión (1, 2, 3...)
  sets_target: number;            // Sets objetivo del programa
  rep_range_min: number;          // Reps mínimas
  rep_range_max: number;          // Reps máximas
  rir_target: number;             // RIR objetivo
  rest_seconds: number;           // Descanso entre sets
  notes: string;                  // Notas del coach/programa
  created_at: Date;
}

/**
 * Detalle completo del workout de hoy
 */
export interface TodayWorkoutDetails {
  workout: {
    id: string;
    mesocycle_id: string;
    user_id: string;
    day_index: number;
    session_name: string;
    planned_date: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    completed_at: Date | null;
    duration_minutes: number | null;
    notes: string;
  };
  mesocycle: {
    id: string;
    user_id: string;
    template_id: string;
    name: string;
    start_date: Date;
    length_weeks: number;
    status: 'planned' | 'active' | 'completed' | 'paused';
  };
  exercises: WorkoutExercise[];
  weekNumber: number;
  totalWeeks: number;
  dayNumber: number;
  totalDays: number;
}

/**
 * Parámetros para generar workouts desde un template
 */
export interface GenerateWorkoutsParams {
  mesocycleId: string;
  userId: string;
  templateId: string;
  startDate: Date;
  lengthWeeks: number;
}

/**
 * Schedule de días de entrenamiento
 */
export interface TrainingSchedule {
  daysPerWeek: number;
  trainingDays: number[];  // 0=Dom, 1=Lun, 2=Mar, etc.
}
