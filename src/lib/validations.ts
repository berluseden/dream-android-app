import { z } from 'zod';

/**
 * Esquemas de validación Zod centralizados
 * Proporciona validación consistente y tipada en toda la aplicación
 */

// ==================== VALIDACIONES BASE ====================

/**
 * Email válido
 */
export const emailSchema = z
  .string()
  .email('Email inválido')
  .min(1, 'Email requerido');

/**
 * Contraseña segura (min 6 caracteres para Firebase)
 */
export const passwordSchema = z
  .string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres');

/**
 * Nombre completo
 */
export const fullNameSchema = z
  .string()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100, 'El nombre no puede exceder 100 caracteres');

/**
 * Número positivo
 */
export const positiveNumberSchema = z
  .number()
  .positive('Debe ser un número positivo');

/**
 * Número de teléfono (formato internacional o local)
 */
export const phoneSchema = z
  .string()
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Número de teléfono inválido')
  .optional();

// ==================== AUTH ====================

/**
 * Login (email + contraseña)
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Registro de usuario
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
  fullName: fullNameSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// ==================== EJERCICIOS ====================

/**
 * Set individual de ejercicio
 */
export const setSchema = z.object({
  weight: positiveNumberSchema.optional(),
  reps: z.number().int().min(1, 'Las repeticiones deben ser al menos 1'),
  rir: z.number().int().min(0).max(10, 'RIR debe estar entre 0 y 10').optional(),
  rpe: z.number().min(1).max(10, 'RPE debe estar entre 1 y 10').optional(),
  completed: z.boolean().default(false),
});

/**
 * Ejercicio completo
 */
export const exerciseSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  muscleGroup: z.enum([
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 
    'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'forearms'
  ]),
  equipment: z.enum(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight']).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  instructions: z.string().optional(),
  videoUrl: z.string().url('URL de video inválida').optional(),
});

/**
 * Feedback de ejercicio
 */
export const exerciseFeedbackSchema = z.object({
  exerciseId: z.string().min(1, 'ID de ejercicio requerido'),
  feeling: z.enum(['too_easy', 'perfect', 'too_hard']),
  comment: z.string().max(500, 'El comentario no puede exceder 500 caracteres').optional(),
  suggestedAdjustment: z.enum(['increase_weight', 'decrease_weight', 'change_exercise']).optional(),
});

// ==================== MESOCICLOS ====================

/**
 * Target semanal de volumen
 */
export const weeklyTargetSchema = z.object({
  muscleGroup: z.string(),
  minSets: z.number().int().min(0),
  maxSets: z.number().int().min(0),
}).refine((data) => data.maxSets >= data.minSets, {
  message: 'maxSets debe ser mayor o igual a minSets',
  path: ['maxSets'],
});

/**
 * Mesociclo
 */
export const mesocycleSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  startDate: z.date(),
  endDate: z.date(),
  weeklyTargets: z.array(weeklyTargetSchema).min(1, 'Debe haber al menos un target de volumen'),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
}).refine((data) => data.endDate > data.startDate, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['endDate'],
});

// ==================== PERFIL DE FUERZA ====================

/**
 * Entrada de perfil de fuerza (1RM)
 */
export const strengthProfileSchema = z.object({
  exerciseName: z.string().min(1, 'Nombre de ejercicio requerido'),
  oneRepMax: positiveNumberSchema,
  estimatedFromReps: z.boolean().default(false),
  testedDate: z.date().default(() => new Date()),
});

// ==================== MENSAJES ====================

/**
 * Mensaje coach-cliente
 */
export const messageSchema = z.object({
  recipientId: z.string().min(1, 'ID de destinatario requerido'),
  content: z.string().min(1, 'El mensaje no puede estar vacío').max(2000, 'El mensaje no puede exceder 2000 caracteres'),
  attachmentUrl: z.string().url('URL de archivo adjunto inválida').optional(),
});

// ==================== ADMIN ====================

/**
 * Invitación de usuario
 */
export const invitationSchema = z.object({
  email: emailSchema,
  role: z.enum(['user', 'coach', 'admin']),
  coachId: z.string().optional(),
});

/**
 * Creación de usuario (admin)
 */
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: fullNameSchema,
  role: z.enum(['user', 'coach', 'admin']),
  coachId: z.string().optional(),
});

// ==================== CONFIGURACIÓN ====================

/**
 * Preferencias de usuario
 */
export const userSettingsSchema = z.object({
  units: z.enum(['metric', 'imperial']).default('metric'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  notifications: z.object({
    workoutReminders: z.boolean().default(true),
    coachMessages: z.boolean().default(true),
    weeklyReports: z.boolean().default(true),
  }).default({}),
  privacy: z.object({
    shareProgress: z.boolean().default(false),
    allowAnalytics: z.boolean().default(true),
  }).default({}),
});

// ==================== TIPOS INFERIDOS ====================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SetInput = z.infer<typeof setSchema>;
export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type ExerciseFeedbackInput = z.infer<typeof exerciseFeedbackSchema>;
export type WeeklyTargetInput = z.infer<typeof weeklyTargetSchema>;
export type MesocycleInput = z.infer<typeof mesocycleSchema>;
export type StrengthProfileInput = z.infer<typeof strengthProfileSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;

/**
 * Helper para validar datos y obtener errores formateados
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return { success: false, errors };
}
