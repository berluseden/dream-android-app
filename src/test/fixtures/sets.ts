import { SetHistory } from '@/lib/algorithms';

export const mockSetHistory: SetHistory[] = [
  {
    load: 80,
    completed_reps: 10,
    rir_actual: 2,
    rpe: 8,
    perceived_pump: 7,
    perceived_soreness: 4,
    created_at: new Date('2025-10-01'),
  },
  {
    load: 80,
    completed_reps: 9,
    rir_actual: 2,
    rpe: 8,
    perceived_pump: 7,
    perceived_soreness: 4,
    created_at: new Date('2025-10-03'),
  },
  {
    load: 80,
    completed_reps: 10,
    rir_actual: 1,
    rpe: 9,
    perceived_pump: 8,
    perceived_soreness: 5,
    created_at: new Date('2025-10-05'),
  },
];

export const mockPlateauHistory: SetHistory[] = [
  {
    load: 100,
    completed_reps: 8,
    rir_actual: 2,
    rpe: 8,
    created_at: new Date('2025-10-01'),
  },
  {
    load: 100,
    completed_reps: 8,
    rir_actual: 2,
    rpe: 8,
    created_at: new Date('2025-10-04'),
  },
  {
    load: 100,
    completed_reps: 8,
    rir_actual: 2,
    rpe: 8,
    created_at: new Date('2025-10-07'),
  },
  {
    load: 100,
    completed_reps: 8,
    rir_actual: 2,
    rpe: 8,
    created_at: new Date('2025-10-10'),
  },
];

export const mockHighRIRHistory: SetHistory[] = [
  {
    load: 60,
    completed_reps: 10,
    rir_actual: 4,
    rpe: 6,
    created_at: new Date('2025-10-01'),
  },
  {
    load: 60,
    completed_reps: 10,
    rir_actual: 3,
    rpe: 7,
    created_at: new Date('2025-10-03'),
  },
  {
    load: 60,
    completed_reps: 10,
    rir_actual: 3,
    rpe: 7,
    created_at: new Date('2025-10-05'),
  },
];
